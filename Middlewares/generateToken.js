import jwt  from "jsonwebtoken";
const generateToken = (userData) =>{
    return jwt.sign(userData,process.env.SECRET_KEY,{expiresIn:"10d"})
}
export {generateToken}