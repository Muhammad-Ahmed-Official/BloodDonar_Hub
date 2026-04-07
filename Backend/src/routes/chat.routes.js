import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { getMessages, getConversations, sendMessage, deleteMessage, editMessage } from "../controllers/chat.controller.js";

const chatRouter = Router();

chatRouter.use(verifyJwt);

chatRouter.route("/conversations").get(getConversations);
chatRouter.route("/messages").post(sendMessage);
chatRouter.route("/messages/:receiverId").get(getMessages);
chatRouter.route("/messages/:customId").delete(deleteMessage).patch(editMessage);

export default chatRouter;
