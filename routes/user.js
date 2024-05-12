
const router = require("express").Router();

const userController = require("../controllers/user");
const authController = require("../controllers/auth");

// update
router.patch("/update-me",authController.protect ,userController.updateMe);
                         // middle-ware           // api function.

router.post("/get-users", authController.protect, userController.getUsers);
router.get("/get-friends", authController.protect, userController.getFriends);
router.get("/get-friend-requests", authController.protect, userController.getRequests);

module.exports = router;





// http://localhost:3000/v1/user/update-me