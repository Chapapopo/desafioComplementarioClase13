import mongoose from "mongoose";

const collectionName = 'User';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: function (v) {
                return v !== "adminCoder@coder.com";
            },
            message: props => `${props.value} no es un email válido.`
        }
    },
    age: {
        type: Number,
        required: true,
        min: 1, // Establecer el valor mínimo permitido
    },
    password: {
        type: String,
        required: true,
        unique: true,
    },
    cart: {
        type: Number
    },
    rol: {
        type: String,
        default: "user",
        required: true,
    }
});
;

// producto.model.js
const User = mongoose.model(collectionName, userSchema);
export default User;