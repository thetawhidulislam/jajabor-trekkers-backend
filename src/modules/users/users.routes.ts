import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { validate } from "../../middlewares/validate";
import { usersController } from "./users.controller";
import { getUsersQuerySchema, updateMeSchema } from "./users.validation";

export const usersRouter = Router();

usersRouter.get("/me", authenticate, usersController.getMe);
usersRouter.patch("/me", authenticate, validate({ body: updateMeSchema }), usersController.updateMe);
usersRouter.get("/", authenticate, authorize(["ADMIN"]), validate({ query: getUsersQuerySchema }), usersController.listUsers);
