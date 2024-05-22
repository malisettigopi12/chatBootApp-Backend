
const router = require("express").Router();

const userController = require("../controllers/user");
const authController = require("../controllers/auth");

router.post(
    "/generate-zego-token",
    authController.protect,
    userController.generateZegoToken
);

router.get("/get-me", authController.protect, userController.getMe);
// update
router.patch("/update-me",authController.protect ,userController.updateMe);
                         // middle-ware           // api function.
router.get("/get-all-verified-users", authController.protect, userController.getAllVerifiedUsers);
router.get("/get-users", authController.protect, userController.getUsers);
router.get("/get-friends", authController.protect, userController.getFriends);
router.get("/get-friend-requests", authController.protect, userController.getRequests);

router.post("/start-audio-call", authController.protect, userController.startAudioCall);
router.post("/start-video-call", authController.protect, userController.startVideoCall);

router.get("/get-call-logs", authController.protect, userController.getCallLogs);
module.exports = router;





// http://localhost:3000/v1/user/update-me