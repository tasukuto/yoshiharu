// @ts-check
import { parse } from "../libs/csv-parse/dist/esm/sync.js";

// const records = parse(csvData, {
//   columns: true,         // ヘッダーをキーとして使用
//   skip_empty_lines: true // 空行を無視
// });
// console.dir(records);

/**
 *
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

// const class_info = document.getElementById('class_info')
// const student_info = document.getElementById('student_info')

// console.log(class_info)
// console.log(student_info)

// const THRESHOLD = 2025;
// const csvData = `
// name,age,city
// Alice,30,New York
// Bob,25,Los Angeles
// Charlie,35,Chicago
// `;
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
`
// const records = parse(csvData, {
//   columns: true, // ヘッダーをキーとして使用
//   skip_empty_lines: true, // 空行を無視
// });

// console.log(records);
// const class_info = [
//   { '科目番号': 6501102, '学籍番号': 202710025 },
//   { '科目番号': 6501102, '学籍番号': 202710054 },
//   { '科目番号': 6501102, '学籍番号': 202710015 },
//   { '科目番号': 6501102, '学籍番号': 202710010 },
//   { '科目番号': 6501102, '学籍番号': 202713003 },
//   { '科目番号': 6501102, '学籍番号': 202713055 },
//   { '科目番号': 6501102, '学籍番号': 202713036 },
//   { '科目番号': 6501102, '学籍番号': 202610000 },
//   { '科目番号': 6501102, '学籍番号': 202610024 },
//   { '科目番号': 6501102, '学籍番号': 202610029 },
//   { '科目番号': 6501102, '学籍番号': 202613097 },
//   { '科目番号': 6501102, '学籍番号': 202613081 },
//   { '科目番号': 6501102, '学籍番号': 202110098 },
//   { '科目番号': 6501102, '学籍番号': 202510049 },
//   { '科目番号': 6501102, '学籍番号': 202513059 }
// ];

// const student_info = [
//     { '学籍番号': 202710025, '入学年度': 2027, '入学年次': 1 },
//     { '学籍番号': 202710054, '入学年度': 2027, '入学年次': 1 },
//     { '学籍番号': 202710015, '入学年度': 2027, '入学年次': 1 },
//     { '学籍番号': 202710010, '入学年度': 2027, '入学年次': 1 },
//     { '学籍番号': 202713003, '入学年度': 2027, '入学年次': 3 },
//     { '学籍番号': 202713055, '入学年度': 2027, '入学年次': 3 },
//     { '学籍番号': 202713036, '入学年度': 2027, '入学年次': 3 },
//     { '学籍番号': 202610000, '入学年度': 2026, '入学年次': 1 },
//     { '学籍番号': 202610024, '入学年度': 2026, '入学年次': 1 },
//     { '学籍番号': 202610029, '入学年度': 2026, '入学年次': 1 },
//     { '学籍番号': 202613097, '入学年度': 2026, '入学年次': 3 },
//     { '学籍番号': 202613081, '入学年度': 2026, '入学年次': 3 },
//     { '学籍番号': 202110098, '入学年度': 2021, '入学年次': 1 },
//     { '学籍番号': 202510049, '入学年度': 2025, '入学年次': 1 },
//     { '学籍番号': 202513059, '入学年度': 2025, '入学年次': 3 }
// ];

// const num_class = class_info[0]["科目番号"];

const students_u2025 = [];

// for (let c_info of class_info) {
//   let num_student = 0;
//   for (let s_info of student_info ) {
//     if (c_info['学籍番号'] === s_info['学籍番号']) {
//       num_student = s_info['学籍番号'];
//       const year_applied = s_info['入学年度'] - s_info['入学年次'];
//       if (year_applied < THRESHOLD) {
//         students_u2025.push(s_info['学籍番号']);
//       }
//       break;
//     }
//   }
//   if (num_student == 0) {
//     console.log(`${c_info['学籍番号']} is NOT included in students list.`);
//   }
// }

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
  console.dir(class_list[0]);
  for (const class_info of class_list) {
    if (
      !(
        typeof class_info === "object" &&
         Object.entries(class_info).length === 3
      )
    ) {
      return undefined;
    }
    for(const class_element of Object.values(class_info)){
      if(typeof class_element !== "string"){
        return undefined;
      }
      // console.dir(class_element);
    }
  }
  return class_list;
}

function main() {
  const class_info = mustGetElementById("class_info");
  const student_info = mustGetElementById("student_info");
  console.dir(class_info);
  if (!(class_info instanceof HTMLInputElement)) {
    throw new Error("bad selectFood.value");
  }
  const class_info_list = mitaniParseClass(csvData);
  console.dir(class_info_list);
}
main();
