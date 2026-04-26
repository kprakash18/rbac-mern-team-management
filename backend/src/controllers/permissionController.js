import express from 'express' ;
import Permission from '../models/permissionModel.js' ;

// create permission api
export const createPermission = async (req,res)=>{
  const {name} = req.body ;
  // to prevent duplicate
  if (!name) {
    return res.status(400).json({ error: "Permission name required" });
  } 
  // create permission api
    try{
        const permission = await Permission.create({name}) ;
        res.status(201).json({permission}) ;
    } catch(error){
        res.status(500).json({error: error.message}) ;
    }
} ;

// get permission api
export const getPermissions = async (req, res) => {
  try {
    const permissions = await Permission.find();
    res.json(permissions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};