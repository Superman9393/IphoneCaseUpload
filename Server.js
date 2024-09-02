import express from 'express'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import cors from 'cors'
import multer from 'multer'
import mongoose from 'mongoose'
import bodyParser from 'body-parser'
import dotenv from 'dotenv'
import { IphoneCaseModel } from './models/IphoneCase.js'
dotenv.config()

// create server instance
const app = express()
app.use(cors())
app.use(bodyParser.json())


// connect ot database
const connect = async()=>{
    await mongoose.connect(process.env.DB_URL,{serverSelectionTimeoutMS:5000, dbName:process.env.DB_NAME})
        .then(console.log('connected to database'))
}
connect()

// create s3 client 
const s3Client = new S3Client({
    endpoint: process.env.EndPoint, // Find your endpoint in the control panel, under Settings. Prepend "https://".
    forcePathStyle: false, // Configures to use subdomain/virtual calling format.
    region: process.env.AWS_REGION, // Must be "us-east-1" when creating new Spaces. Otherwise, use the region in your endpoint (for example, nyc3).
    credentials: {
      accessKeyId: process.env.AccessKey, // Access key pair. You can create access key pairs using the control panel or API.
      secretAccessKey: process.env.SecretAccessKey // Secret access key defined through an environment variable.
    }
});
const upload = multer({storage:multer.memoryStorage()})

// create crud Operations for database
// create case
app.post("/createCase", upload.single('file'), (req,res)=>{
  const params = {
    Bucket:process.env.BUCKET,
    Key:req.file.originalname,
    Body:req.file.buffer,
    ACL:"public-read"
  }
  const UploadObject = async ()=>{
    try{
        const data = await s3Client.send(new PutObjectCommand(params));
        console.log(`Successfully uploaded object:`+params.Bucket+"/"+params.Key);
        return data
    }catch(err){
        console.log(err)
    }
  }
  const data = UploadObject();
  
  
  let newCase = new IphoneCaseModel({
    title:req.file.originalname,
    model:req.body.model,
    size: Math.floor(req.file.buffer.byteLength/(1024*1024))+"mb",
    imgUrl:data.location || `https://${process.env.BUCKET}.nyc3.cdn.digitaloceanspaces.com/${req.file.originalname}`,
  })
  let id = newCase._id
  newCase = newCase.save();
  console.log(`case uploaded: ${id.toString()}`)
  res.status(200).json({message:"case successfully uploaded"})
})

// find case
app.get("/findCase/:id",async(req,res)=>{
  let Case = await IphoneCaseModel.findById(req.params.id)
  if(!Case)return console.log(`no case found with id: ${req.params.id}`)
  res.status(200).json({Case})
})
// get all cases 
app.get('/findAllCases',async(req,res)=>{
    let Cases = await IphoneCaseModel.find();
    if(!Cases) return console.log(`there are no cases available`)
    console.log(`retrieving cases..`)
    res.status(200).json(Cases)
})
// update case
app.put('/updateCase/:id',async (req,res)=>{
 let Case = await IphoneCaseModel.findById(req.params.id)
 if(!Case) return console.log(`no case found with id: ${req.params.id}`)
 let UpdatedCase = await IphoneCaseModel.findByIdAndUpdate(req.params.id,{title:req.body.title, size:req.body.size, imgUrl:req.body.imgUrl},(err,docs)=>{
    if(err){
        console.log(err)
    }else{
        console.log(`updated case: ${docs}`)
        res.status(200).json({updatedCase:docs})
    }
})
})
app.delete("/deleteCase/:id",async(req,res)=>{
  let Case = await IphoneCaseModel.findById(req.params.id)
  if(!Case) return console.log(`no case found with id: ${req.params.id}`)
  let deletedCase = await IphoneCaseModel.findByIdAndDelete(req.params.id)
  res.status(200).json({message:`case deleted: ${deletedCase}`})
})
// establish port and listen on port
const port = process.env.PORT|| 3000
app.listen(process.env.PORT || 3000, console.log(`listening on port: ${port}`))