import crypto from "crypto";
import mongoose, { Query, Schema, Model } from "mongoose";
import bcrypt from "bcrypt";
import validator from "validator";

interface User {
  name: string;
  email: string;
  password: string;
  passwordConfirm?: string;

  passwordChangedAt?: Date;

  passwordResetToken?: string;

  passwordResetExpires?: Date;

  active?: boolean;
}

interface UserMethods {
  correctPassword(
    givenPassword: string,
    userPassword: string
  ): Promise<boolean>;

  changedPasswordAfter(jwtTimeStamp: number): boolean;

  createPasswordsResetToken(): string;
}

type UserModel = Model<User, {}, UserMethods>;

const userSchema = new Schema<User, UserModel, UserMethods>({
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
      validator: function (this: User, el: string) {
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

userSchema.methods.correctPassword = async function (
  givenPassword: string,
  userPassword: string,
) {
  return await bcrypt.compare(givenPassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (
  jwtTimeStamp: number,
): boolean {
  if (this.passwordChangedAt) {
    const changedTime = Math.floor(this.passwordChangedAt.getTime() / 1000);

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

  this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);

  return resetToken;
};

const userModel = mongoose.model<User, UserModel>(
  "User",
  userSchema
);

export { userModel, userSchema };
