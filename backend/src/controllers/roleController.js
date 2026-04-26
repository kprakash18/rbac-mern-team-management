import Role from "../models/role.js";
import Permission from "../models/permissionModel.js";

export const createRole = async (req, res) => {
  try {
    const { name, permissions } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Role name required" });
    }

    //check if  permission id exist
    if (permissions && permissions.length > 0) {
      const validPermissions = await Permission.find({
        Id: { $in: permissions }
      });

      if (validPermissions.length !== permissions.length) {
        return res.status(400).json({ error: "Invalid permission IDs" });
      }
    }

    const role = await Role.create({ name, permissions });

    res.status(201).json(role);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//Get Roles 
export const getRoles = async (req, res) => {
  try {
    const roles = await Role.find().populate("permissions");
    res.json(roles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};