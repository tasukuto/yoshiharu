// // @ts-check
import { parse } from "./libs/csv-parse/dist/esm/sync.js";  
import * as XLSX from './libs/xlsx-parse/xlsx.mjs';

// const records = parse(csvData, {
//   columns: true,         // ヘッダーをキーとして使用
//   skip_empty_lines: true // 空行を無視
// });
// console.dir(records);

/**
 * @param {string} id
 * @returns {HTMLElement}
 */
function mustGetElementById(id) {
  const object = document.getElementById(id);
  if (object === null) {
    throw new Error(`${id} not found`);
  }
  return object;
}

/**
 * @param {string} selector
 * @returns {Element}
 */
function mustQuerySelector(selector) {
  const object = document.querySelector(selector);
  if (object === null) {
    throw new Error(`${selector} not found`);
  }
  return object;
}
const student_info = mustGetElementById("student_info");
const output = mustGetElementById("output");

/**
 * @param {string} s
 * @returns {any}
 */
function mitaniParseStudent(s) {
  const class_list = parse(s, {
    columns: true,
    skip_empty_lines: true,
  });
  if (!Array.isArray(class_list)) {
    return undefined;
  }
  for (const class_info of class_list) {
    if (
      !(
        typeof class_info === "object" &&
        Object.entries(class_info).length === 4
      )
    ) {
      console.dir("!a");
      return undefined;
    }
    for (const class_element of Object.values(class_info)) {
      if (typeof class_element !== "string") {
        return undefined;
      }
    }
  }
  return class_list;
}
function handleFileUpload(event) {
  const file = event.target.files?.[0];
  if (!file) {
    output.innerHTML = "多分ふあいるが違う！！";
    return;
  }
  console.log("!!!!");
  const reader = new FileReader();
  reader.onload = (e) => {
    const textContent = e.target.result;
    if (typeof textContent !== "string") {
      output.innerHTML = "多分ふあいるが違う！！";
      return;
    }
    const student_info_list = mitaniParseStudent(textContent);
    if (
      student_info_list === undefined ||
      student_info_list[0]["学籍番号"] === undefined ||
      student_info_list[0]["入学年度"] === undefined ||
      student_info_list[0]["入学年次"] === undefined ||
      student_info_list[0]["学生氏名"] === undefined
    ) {
      output.innerHTML = "多分ふあいるが違う！！";
    } else {
      console.dir(student_info_list[0]["学籍番号"]);
      const displayList = [];
      for (const student_infomation of student_info_list) {
        const enrollYear = parseInt(student_infomation["入学年度"]);
        const grade = parseInt(student_infomation["入学年次"]);
        if (enrollYear - grade + 1 <= 2024) {
          displayList.push(student_infomation);
        }
      }
      console.dir(displayList);
      const ul = document.createElement("ul");
      if (displayList.length === 0) {
        output.innerHTML = "おや、いないようじゃ";
      } else {
        for (const displayItem of displayList) {
          const li = document.createElement("li");
          const span1 = document.createElement("span");
          const span2 = document.createElement("span");
          const span3 = document.createElement("span");
          span1.textContent = displayItem["学籍番号"];
          span2.textContent = displayItem["学生氏名"];
          span3.textContent = "  ";
          console.dir(displayItem["学生氏名"]);
          li.appendChild(span1);
          li.appendChild(span3);
          li.appendChild(span2);
          ul.appendChild(li);
        }
        output.innerHTML = "";
        output.appendChild(ul);
      }
    }
  };
  reader.readAsText(file);
}

document.addEventListener("DOMContentLoaded", () => {
  student_info.addEventListener("change", handleFileUpload);
});
