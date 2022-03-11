import { useState, useRef } from "react"
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.entry";
const pdfjsLib = require(/* webpackChunkName: "pdfjs-dist" */ `pdfjs-dist`)

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;


function concatUntilSpace(row){
    let myStr = "";
    while(row[0] !== " "){
        myStr += row[0]
        row.shift();
    }
    row.shift()//space
    return myStr.trim();
}

function concatWhileContainsAnyOf(row){
    let myStr = "";
    let cont;
    let keywords = document.getElementById("relationKeywordBases").value.split(',');
    while(true){
        cont = false;
        for(let kw in keywords){
            if(row[0].search(keywords[kw]) !== -1){
                cont = true
                break;
            }
        }
        if(cont) {
            myStr += row[0] + " "
            row.shift();
        } else {
            row.shift();//space
            return myStr.trim();
        }
    }
}

function dataRowToHuman(rowOrg){
    let row = [...rowOrg];
    let sex = row[0] === 'E' ? 'male' : 'female';
    row.shift()// K or E
    row.shift()//space
    let relation = concatWhileContainsAnyOf(row)
    let name = concatUntilSpace(row);
    let surname = concatUntilSpace(row);
    while(row[0].search(/[0-9]+\/[0-9]+\/[0-9]+/g) === -1) row.shift();
    let birthDate = row[0];
    row.shift();

    while(row[0].search('Ölüm') === -1 && row[0].search('Sağ') === -1) row.shift();
    let isAlive = row[0].search('Ölüm') === -1;
    row.shift();
    
    let deathDate = 'N/A';
    if(!isAlive){
        deathDate = row[0];
    }

    return {
        sex,
        relation,
        name,
        surname,
        birthDate,
        isAlive,
        deathDate
    }
}
function convertStringArrayToFTJSON(arr){
    console.log(arr)
    let subarr = []
    let newArr = []

    for(let i = 0; i < arr.length; i++)
    {
        if(arr[i] === 'K' || arr[i] === 'E')
        {
            newArr.push(subarr)
            subarr = []
        }
        subarr.push(arr[i])
    }
    newArr.push(subarr)
    newArr.shift()
    for(let i = 0; i < newArr.length; i++){
        console.log(dataRowToHuman(newArr[i]))
    }
    console.log(newArr)
}

export default function DataParser({setData}){
    const [pdfState, setPdfState] = useState();
    if(pdfState){
        return <div>{pdfState}</div>
    }
    return <>
        <label htmlFor="FileSelector">Upload PDF  </label>
        <input type="file" accept=".pdf" id="FileSelector" onChange={(e)=>{
            let file = e.target.files[0];
            var reader = new FileReader();
            reader.onload = function(evt) {
                var loadingTask = pdfjsLib.getDocument({data: evt.target.result});
                // loadingTask.onProgress = (e)=>{
                //     console.log(e)
                // }
                
                // loadingTask.onUnsupportedFeature = (e)=>{
                //     console.log(e)
                // }
                setPdfState("Parsing...")
                loadingTask.promise.then(async (doc)=>{
                    // console.log(doc)
                    var whole_doc = []
                    for(let i = 1; i <= doc.numPages; i++)
                    {
                        let page = await doc.getPage(i);
                        let content = await page.getTextContent();
                        whole_doc = whole_doc.concat(content.items.map((item) => item.str))
                    }
                    convertStringArrayToFTJSON(whole_doc)

                    setPdfState("Ready.")
                }).catch((e)=>{
                    console.log("PDF Load error: ", e)
                    setPdfState("Parse Error!")
                }) 
            };
            reader.onerror = function(e) {
                console.log('Reader Error : ' + e.type);
                setPdfState("Read Error!")
            };
            setPdfState("Reading...")
            reader.readAsBinaryString(file);
        }}/>    
    </>
}