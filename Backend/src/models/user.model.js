import mongoose from 'mongoose';
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
        unique: true,
    },
    code: {
        type: String,
        default: "",
    },
    codeExpire: {
      type: Date,
      default: "",
    },
}, { timestamps: true } );


// Method for bcrypt password (async hook – don't use next, Mongoose waits for the promise)
userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 10);
});


//Method for compare password
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

export const User = mongoose.model("User", userSchema);