import crypto from "crypto";
import mongoose, { Query, Schema, InferSchemaType } from "mongoose";
import bcrypt from "bcrypt";
import validator from "validator";

const userSchema = new Schema({
  name: {
    type: String,
    required: [true, "A user must have name"],
    trim: true,
  },

  email: {
    type: String,
    required: [true, "A user must have an email"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please provide a valid email"],
  },

  password: {
    type: String,
    required: [true, "Please provide a password"],
    minlength: 8,
    select: false,
  },

  passwordConfirm: {
    type: String,
    required: [true, "Please confirm password"],
    validate: {
      validator: function (this: any, el: string) {
        return el === this.password;
      },
      message: "Passwords are not the same",
    },
  },

  passwordChangedAt: Date,

  passwordResetToken: String,

  passwordResetExpires: Date,

  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(String(this.password), 12);

  this.passwordConfirm = undefined as any;
});

userSchema.pre("save", function () {
  if (!this.isModified("password") || this.isNew) return;

  this.passwordChangedAt = new Date(Date.now() - 1000);
});

userSchema.pre("find", function (this: Query<any, any>) {
  this.find({ active: { $ne: false } });
});

userSchema.pre("findOne", function (this: Query<any, any>) {
  this.find({ active: { $ne: false } });
});

userSchema.methods.correctPasswordAfter = function (
  jwtTimeStamp: number
): boolean {
  if (this.passwordChangedAt) {
    const changedTime = Math.floor(
      this.passwordChangedAt.getTime() / 1000
    );

    return changedTime > jwtTimeStamp;
  }

  return false;
};

userSchema.methods.createPasswordsResetToken = function (): string {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = new Date(
    Date.now() + 10 * 60 * 1000
  );

  return resetToken;
};

type User = InferSchemaType<typeof userSchema>;

const userModel = mongoose.model<User>("User", userSchema);

export default userModel;