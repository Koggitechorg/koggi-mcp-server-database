import dotenv from "dotenv";
dotenv.config();
export const CONFIG = {
    apiUrl: process.env.EXTERNAL_URL || "https://external-qa-xw472ob7ea-uc.a.run.app",
    token: process.env.API_TOKEN || "jaFLgy-Z-kk57FPON-p_amaGbT33dr31cvNqzX_C7GvhIIkuKxStbYh_j2gH50F8",
};
