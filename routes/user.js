
const router = require("express").Router();

const userController = require("../controllers/user");
const authController = require("../controllers/auth");

// update
router.patch("/update-me",authController.protect ,userController.updateMe);
                         // middle-ware           // api function.


module.exports = router;





// http://localhost:3000/v1/user/update-me