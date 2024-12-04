import { fetch } from "wix-fetch";
import wixLocation from "wix-location-frontend";
import wixData from 'wix-data';
import { files as FileManager } from "wix-media.v2";
//@ts-ignore
import { PDFDocument } from "public/libraries/pdf-lib.min.js";
// import pdf from 'pdf-parse';

let aiResponse;

// import { PDFDocument } from 'pdf-lib';

$w.onReady(async () => {
    setListeners();
    $w("#voiceCore1").onResponse((e) => {
        console.log(e.data.message);
        $w("#promptElement").setAttribute("prompt-text", e.data.message);
    });

    $w('#fieldRepeater').onItemReady(($item, itemData, index) => {
        $item("#fieldTitle").text = itemData.name
        $item("#fieldDescription").text = JSON.stringify({ ...itemData })
    });

    return await pdfTest();
});

export async function setListeners() {
    //custom element for prompt elements

    $w("#promptElement").on("prompt-start", async (e) => {
        console.log("Prompt Start");
    });
    $w("#promptElement").on("prompt-response", async (e) => {
        console.log("Prompt Response");
        aiResponse = e.detail.response;
        console.log(aiResponse);
    });
    $w("#promptElement").on("prompt-progress", async (e) => {
        console.log("Prompt Progress " + e.detail);
    });
    $w("#promptElement").on("prompt-error", async (e) => {
        console.log("Prompt Error");
    });
    $w("#promptElement").on("session-created", async (e) => {
        console.log("Session Created");
    });

    const formBuilder = $w("#mainForm");

    formBuilder.on("form-submit", (event) => {
        console.log("Form submitted:", event.detail);
        // Handle form submission here
    });

    formBuilder.on("field-change", (event) => {
        console.log("Field changed:", event.detail);
        // Handle field change here
    });
}

export async function pdfTest() {
    console.log("Loaded");
    loadPDF(
        "https://www.test-editor-x-3.wixdev-sites.org/_files/ugd/e211a6_dd033367da3140a498d6e5478b697e66.pdf"
        // "https://www.test-editor-x-3.wixdev-sites.org/_files/ugd/1369f0_b55adf6865d64c94ae45292e1fc0e0d3.pdf"
    );
}

import * as pdfjsLib from 'public/libraries/pdfjs-web-dist';

// Set the worker source (important for client-side usage)
// pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@4.9.124/build/pdf.worker.min.mjs`;

async function extractTextFromPDF(pdfData) {
    // Load the PDF document
    const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;

    let fullText = '';

    // Loop through all the pages
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();

        // Extract and combine text items from the page
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n'; // Add a newline to separate pages
    }

    return fullText; // Return the concatenated text
}

$w("#uploadButton1").onChange(async (event) => {
    const files = await $w("#uploadButton1").uploadFiles();
    console.log("Uploaded: ");
    console.log(files);
    if (files) {
        $w("#pdfName").text = "Filling form: "+files[0].originalFileName;
        $w("#pdfName").show();

        console.log(
            await loadPDF(`${wixLocation.baseUrl}/_files/ugd/${files[0].fileName}`)
        );
    }
});

async function loadPDF(fileURL) {
    const response = await fetch(fileURL);

    console.log("Loaded After");
    console.log(response.ok);
    console.log(response);

    /*@ts-ignore*/
    const PDFbuffer = await response.arrayBuffer();
    console.log(typeof PDFbuffer);
    console.log(PDFbuffer.toString().length);
    const pdfDoc = await PDFDocument.load(PDFbuffer);

    try {
        const repeaterItems = pdfDoc
            .getForm()
            .getFields()
            .map((field) => {
                const type = field.constructor.name;
                const name = field.getName();
                const ref = field.ref;
                const isReadOnly = field.isReadOnly();
                const isExported = field.isExported();
                console.log(`${type}: ${name}`);
                console.log(`${ref}${isReadOnly}${isExported}`); //TODO
                "".toLocaleLowerCase
                return {
                    "_id": field.getName().replace(/[^A-Za-z0-9-]/g, '').replace(/ /g, '-').toLocaleLowerCase(),
                    "name": field.getName(),
                    type: field.constructor.name,
                    ref: field.ref,
                    isReadOnly: field.isReadOnly(),
                    isExported: field.isExported(),
                }
            });

        $w('#fieldRepeater').data = repeaterItems;
        $w('#fieldRepeater').show();

        //PDF Parse

        // pdf(PDFbuffer).then(function (data) {

        //     // number of pages
        //     console.log(data.numpages);
        //     // number of rendered pages
        //     console.log(data.numrender);
        //     // PDF info
        //     console.log(data.info);
        //     // PDF metadata
        //     console.log(data.metadata);
        //     // PDF.js version
        //     // check https://mozilla.github.io/pdf.js/getting_started/
        //     console.log(data.version);
        //     // PDF text
        //     console.log(data.text);

        // });

        //pdfjs.
        // console.log(await extractTextFromPDF(PDFbuffer));
        constructAndSendPrompt(repeaterItems)
        console.log(pdfDoc.getForm().getFields());
        $w("#numFields").text =
            "Number of fields: " + pdfDoc.getForm().getFields().length;
        // $w("#json").text =
        //     "" +
        //     pdfDoc
        //     .getForm()
        //     .getFields()
        //     .map((item) => `${JSON.stringify(item)}`);
        $w("#numFields").show();
        return repeaterItems;
    } catch (err) {
        console.error("Error occured");
        console.error(err);
        return null;
    }
}

export function constructAndSendPrompt(itemsArray) {

    const prompt = `
        My online form has the following fields. I want to turn this into an interactive quiz for the user to fill out form fields. Can you reply with a question form for each of these to help them fill out, separated by a double new line ?
        
        ONLY reply with responses line 1 is line of the answer. Make the questions intuitive
        ---
        ${JSON.stringify(itemsArray)}
    `;

    console.log("prompt");
    console.log(prompt);
    $w("#promptElement").setAttribute("prompt-text", prompt);

    // $w('#promptElement').setAttribute('', prompt);
    return "";
}