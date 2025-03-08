// // @ts-check
import { parse } from "../libs/csv-parse/dist/esm/sync.js";

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
const class_info = mustGetElementById("class_info");
const student_info = mustGetElementById("student_info");
const output = mustGetElementById("output");

const csvData = `
学籍番号,入学年度,入学年次
202710025,2027,1
202710054,2027,1
202710015,2027,1
202710010,2027,1
202713003,2027,3
202713055,2027,3
202713036,2027,3
202610000,2026,1
202610024,2026,1
202610029,2026,1
202613097,2026,3
202613081,2026,3
202110098,2021,1
202510049,2025,1
202513059,2025,3
`;

/**
 * @param {string} s
 * @returns {any}
 */
function mitaniParseClass(s) {
  const class_list = parse(s, {
    columns: true, // ヘッダーをキーとして使用
    skip_empty_lines: true, // 空行を無視
  });
  if (!Array.isArray(class_list)) {
    return undefined;
  }
  for (const class_info of class_list) {
    // console.dir(class_info);
    if (
      !(
        typeof class_info === "object" &&
        Object.entries(class_info).length === 48
      )
    ) {
      console.dir("!");
      return undefined;
    }
    for (const class_element of Object.values(class_info)) {
      if (typeof class_element !== "string") {
        // console.dir(class_element);
        return undefined;
      }
    }
  }
  return class_list;
}
/**
 * @param {string} s
 * @returns {any}
 */
function mitaniParseStudent(s) {
  const class_list = parse(s, {
    columns: true, // ヘッダーをキーとして使用
    skip_empty_lines: true, // 空行を無視
  });
  if (!Array.isArray(class_list)) {
    return undefined;
  }
  for (const class_info of class_list) {
    if (
      !(
        typeof class_info === "object"
        // Object.entries(class_info).length === 4
      )
    ) {
      console.dir("!a");
      return undefined;
    }
    for (const class_element of Object.values(class_info)) {
      if (typeof class_element !== "string") {
        // console.dir(class_element);
        return undefined;
      }
    }
  }
  return class_list;
}
function handleFileUpload1(event) {
  const file = event.target.files?.[0];
  if (!file) {
    console.error("ファイルが選択されていません。");
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const textContent = e.target.result;
    if (typeof textContent !== "string") {
      console.error("無効なファイル内容");
      return;
    }
    const class_info_list = mitaniParseClass(textContent);
    console.dir(class_info_list);
  };
  reader.readAsText(file);
}
function handleFileUpload2(event) {
  const file = event.target.files?.[0];
  if (!file) {
    console.error("ファイルが選択されていません。");
    return;
  }
  console.log("!!!!");
  const reader = new FileReader();
  reader.onload = (e) => {
    const textContent = e.target.result;
    if (typeof textContent !== "string") {
      console.error("無効なファイル内容");
      return;
    }
    const student_info_list = mitaniParseStudent(textContent);
    console.dir(student_info_list[0]["学籍番号"]);
    const displayList = [];
    for (const student_infomation of student_info_list) {
      const studentId = parseInt(student_infomation["学籍番号"]);
      const enrollYear = parseInt(student_infomation["入学年度"]);
      const grade = parseInt(student_infomation["入学年次"]);
      if(enrollYear - grade +1 <= 2024){
        displayList.push(student_infomation);
      }
    }
    console.dir(displayList);
    const ul = document.createElement("ul");
    for(const displayItem of displayList){
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
  };
  reader.readAsText(file);
}
function main() {
  // console.dir(class_info);
  if (!(class_info instanceof HTMLInputElement)) {
    throw new Error("bad selectFood.value");
  }

  const file = class_info.files[0];
  if (!(file !== null)) {
    throw new Error("bad selectFood.value");
  }
  // const class_info_list = mitaniParseClass(class_info.value);
}
main();
document.addEventListener("DOMContentLoaded", () => {
  class_info.addEventListener("change", handleFileUpload1);
});
document.addEventListener("DOMContentLoaded", () => {
  student_info.addEventListener("change", handleFileUpload2);
});
