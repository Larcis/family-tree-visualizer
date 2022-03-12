import { useState } from "react"
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.entry";
const pdfjsLib = require(/* webpackChunkName: "pdfjs-dist" */ `pdfjs-dist`)
const short = require('short-uuid');

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
        id: short.generate(),
        gender: sex,
        relation: [relation],
        name,
        surname,
        birthDate,
        isAlive,
        deathDate
    }
}
function convertStringArrayToFTJSON(arr){
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
    newArr = newArr.map(e => dataRowToHuman(e))

    //unify humans
    let uniqHumans = [];
    for(let i = 0; i < newArr.length; i++){
        let found = false;
        for(let j = 0; j < uniqHumans.length; j++){
            if(uniqHumans[j].birthDate === newArr[i].birthDate 
                && uniqHumans[j].name === newArr[i].name 
                && uniqHumans[j].surname === newArr[i].surname
            ){
                found = true;
                uniqHumans[j].relation.push(newArr[i].relation[0])
                break;
            }
        }
        if(!found){
            uniqHumans.push(newArr[i]);
        }
    }
    // for(let i = 0; i < newArr.length; i++){
    //     console.log(dataRowToHuman(newArr[i]))
    // }
    console.log(uniqHumans)
    return uniqHumans;
}

function findHumanWithRelation(humans, relation){
    for(let i = 0;i < humans.length; i++){
        for(let j = 0; j < humans[i].relation.length; j++){
            if(humans[i].relation[j] === relation){
                return humans[i];
            }
        }
    }
}

function updateCompitableArrayAddParent(arr, meId, dadId, momId){
    for(let i = 0; i < arr.length; i++){
        if(arr[i].id === meId){
            arr[i].parents = []
            if(dadId) 
                arr[i].parents.push({
                    "id": dadId,
                    "type": "blood"
                })
            if(momId) 
                arr[i].parents.push({
                    "id": momId,
                    "type": "blood"
                })
            return true;
        }
    }
    return false;
}

function addAsSibling(arr, id, newSib){
    for(let i = 0; i < arr.length; i++){
        if(arr[i].id === id){
            for(let j = 0; j < arr[i].siblings.length; j++){
                if(arr[i].siblings[j].id === newSib){
                    return;
                }
            }
            arr[i].siblings.push({
                "id": newSib,
                "type": "blood"
            })
            break;
        }
    }
}

function updateCompitableArrayAddNewChild(arr, meId, parentID){
    for(let i = 0; i < arr.length; i++){
        if(arr[i].id === parentID){
            for(let j = 0; j < arr[i].children.length; j++){
                addAsSibling(arr, arr[i].children[j].id, meId);
                addAsSibling(arr, meId, arr[i].children[j].id);
            }
            console.log(arr[i])
            arr[i].children.push({
                    "id": meId,
                    "type": "blood"
            });
            return true;
        }
    }
    return false;
}

function addFamily(humans, arr, rootKey, dadKey, momKey){
    // console.log(rootKey, dadKey, momKey);
    let me = findHumanWithRelation(humans, rootKey);
    let dad = findHumanWithRelation(humans, dadKey);
    let mom = findHumanWithRelation(humans, momKey);
    let dadId, momId;
    dadId = dad ? dad.id : null;
    momId = mom ? mom.id : null;
    if(!me) return false;
    if(!updateCompitableArrayAddParent(arr, me.id, dadId, momId)){
        arr.push({
            "id": me.id,
            "extra": me,
            "gender": me.gender,
            "parents": [],
            "siblings": [],
            "spouses": [],
            "children": []
        })
        if(momId){
            arr[arr.length-1].parents.push({
                "id": momId,
                "type": "blood"
            })
        }
        if(dadId){
            arr[arr.length-1].parents.push({
                "id": dadId,
                "type": "blood"
            })
        }
    }
    
    if(dad && !updateCompitableArrayAddNewChild(arr, me.id, dad.id)){
        arr.push({
            "id": dad.id,
            "extra": dad,
            "gender": dad.gender,
            "parents": [],
            "siblings": [],
            "spouses": [],
            "children": [{
                "id": me.id,
                "type": "blood"
            }]
        });
        if(momId){
            arr[arr.length-1].spouses.push({
                "id": momId,
                "type": "married"
            })
        }
    }
    
    if(mom && !updateCompitableArrayAddNewChild(arr, me.id, mom.id)){
        arr.push({
            "id": mom.id,
            "extra": mom,
            "gender": mom.gender,
            "parents": [],
            "siblings": [],
            "spouses": [],
            "children": [{
                "id": me.id,
                "type": "blood"
            }]
        });
        if(dadId){
            arr[arr.length-1].spouses.push({
                "id": dadId,
                "type": "married"
            })
        }
    }

    return true;
}

function generateRelativesTreeFromHumans(humans){
    let compitableArr = [];
    let ret = true;
    addFamily(humans, compitableArr, "Kendisi", "Babası", "Annesi");
    
    let p = ["Babasının", "Annesinin"];
    let str1;
    let counter = 1;
    while(ret){
        for(let i = 0; i < Math.pow(2, counter); i++){
            str1 = ""
            let val = i;
            for(let j = 0; j < counter; j++)
            {
                str1 += p[val & 1] + " ";
                val = val >> 1;
            }
            str1 = str1.trim();
            console.log(str1);
            ret = addFamily(humans, compitableArr, str1.substring(0, str1.length - 3), str1 + " Babası", str1 + " Annesi")
        }
        counter++;
    }

    // str = "Annesi"
    // while(ret){
    //     ret = addFamily(humans, compitableArr, str, str + "nın Babası", str + "nın Annesi")
    //     str = "Annesinin " + str;
    // }
    // console.log(addFamily(humans, compitableArr, "Babası", "Babasının Babası", "Babasının Annesi"));
    // console.log(addFamily(humans, compitableArr, "Annesi", "Annesinin Babası", "Annesinin Annesi"));
    
    console.log(compitableArr)
    return compitableArr;

}


export default function DataParser({setData}){
    const [pdfState, setPdfState] = useState();
    if(pdfState){
        return <div>{pdfState}</div>
    }
    return <>
        <label htmlFor="FileSelector">PDF Yükle  </label>
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
                setPdfState("İşleniyor...")
                loadingTask.promise.then(async (doc)=>{
                    // console.log(doc)
                    var whole_doc = []
                    for(let i = 1; i <= doc.numPages; i++)
                    {
                        let page = await doc.getPage(i);
                        let content = await page.getTextContent();
                        whole_doc = whole_doc.concat(content.items.map((item) => item.str));
                    }
                    let humans = convertStringArrayToFTJSON(whole_doc);
                    let compitableArr = generateRelativesTreeFromHumans(humans)
                    let rootId = findHumanWithRelation(humans, "Babasının Annesi").id
                    // let rootId = findHumanWithRelation(humans, "Annesi").id
                    setData(compitableArr, rootId, rootId);
                    // let meId = findHumanWithRelation(humans, "Kendisi").id
                    // setData(compitableArr, meId, meId);
                    setPdfState("Hazır.");
                }).catch((e)=>{
                    console.log("PDF Load error: ", e);
                    setPdfState("İşleme Hatası!");
                }) 
            };
            reader.onerror = function(e) {
                console.log('Reader Error : ' + e.type);
                setPdfState("Okuma Hatası!");
            };
            setPdfState("Okunuyor...");
            reader.readAsBinaryString(file);
        }}/>    
    </>
}