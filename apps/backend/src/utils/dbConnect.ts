import * as mongoose from "mongoose";
import { DatabaseError } from "../errors/index.js";

const dbConnect = async (uri: string | undefined): Promise<void> => {
  if (!uri) {
    throw new DatabaseError(
      "**[error]** MONGODB_URI is missing. Please, set it in your environment variable.",
    );
  }

  try {
    await mongoose.connect(uri);
    console.log("**[system]** successfully connected to MongoDB...");
  } catch (e) {
    throw new DatabaseError(`**[error]** failed to connect to MongoDB: ${e}`);
  }
};

export default dbConnect;
