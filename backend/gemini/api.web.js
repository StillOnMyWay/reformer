import { getSecret } from "wix-secrets-backend";
/************
.web.js file
************

Backend '.web.js' files contain functions that run on the server side and can be called from page code.

Learn more at https://dev.wix.com/docs/develop-websites/articles/coding-with-velo/backend-code/web-modules/calling-backend-code-from-the-frontend

****/

/**** Call the sample multiply function below by pasting the following into your page code:

import { multiply } from 'backend/new-module.web';

$w.onReady(async function () {
   console.log(await multiply(4,5));
});
https://github.com/StillOnMyWay/reformer.git
****/

import { Permissions, webMethod } from "wix-web-module";

export const multiply = webMethod(
    Permissions.Anyone,
    (factor1, factor2) => {
        return factor1 * factor2
    }
);

import { GoogleGenerativeAI } from "@google/generative-ai";

export const convertToTransactions = webMethod(Permissions.Anyone, async prompt => {
    const API_KEY = await getSecret('GEMINI_API_KEY')
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash-latest",
        generationConfig: {
            maxOutputTokens: 8192
        }
    });
    const result = await model.generateContent([prompt]);
    console.log(result.response.text());
    return result.response.text();
})