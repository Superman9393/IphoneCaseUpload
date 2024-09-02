import mongoose from "mongoose";
const IphoneCaseSchema = new mongoose.Schema({
    title:{type:String},
    model:{type:String},
    size:{type:String, require:true},
    imgUrl:{type:String, require:true}
},{timestamps:true})

export const IphoneCaseModel = mongoose.model("IphoneCase", IphoneCaseSchema)