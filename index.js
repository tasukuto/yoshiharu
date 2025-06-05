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

const students_info_element = mustGetElementById("students_info_element");
const courses_info_element = mustGetElementById("courses_info_element");
const emails_info_element = mustGetElementById("emails_info_element");
const verify_element = mustGetElementById("verify_element");
const output = mustGetElementById("output");

/**
 * @param {string} s
 * @returns {any}
 */
function mitaniParseStudents(s) {
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

function mitaniParseCourses(arrayBufferContext, course_name) {
  let workbook;
  try {
    workbook = XLSX.read(arrayBufferContext, { type: "array" });
  } catch (err) {
    console.error("XLSXの読み込みエラー:", err);
    return undefined;
  }
  const courses_info_list = [];
  for (const sheetName of workbook.SheetNames) {
    const workSheet = workbook.Sheets[sheetName];

    const header = XLSX.utils.sheet_to_json(workSheet, {
      header: "A",
      range: "B2:F3",
      defval: "",
      raw: false
    });
    const course_id = header[0]["C"];
    const course_name_in_book = header[1]["C"];
    if (course_name !== course_name_in_book) {
      return undefined;
    }

    const data = XLSX.utils.sheet_to_json(workSheet, {
      range: 4,
      defval: "",
      raw: false
    });
    const students_ids = data
    .map(row => row["学籍番号"])
    .filter(id => /^\d{9}$/.test(id));

    courses_info_list.push({
      "科目番号": course_id,
      "学籍番号": students_ids
    });
  }
  return courses_info_list;
}

function mitaniParseEmails(arrayBufferContext, course_name) {
  let workbook;
  try {
    workbook = XLSX.read(arrayBufferContext, { type: "array" });
  } catch (err) {
    console.error("XLSXの読み込みエラー:", err);
    return undefined;
  }
  const workSheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(workSheet, {
    header: 1,
    defval: "", 
    raw: false
  });
  const emails_info_list = data
    .filter(row => row[1] === "データサイエンス")
    .map(row => ({
      科目番号: row[0],
      担当教員: row[8],
      アドレス: row[9]
    }));
  return emails_info_list;
}

function renderStudentList(course_id, displayList, container) {
  const div = document.createElement("div");
  const title = document.createElement("h3");
  title.textContent = `科目番号：${course_id}`
  div.appendChild(title);

  const ul = document.createElement("ul");
  if (displayList.length === 0) {
    const empty = document.createElement("p");
    empty.textContent = "おや、いないようじゃ";
    div.appendChild(empty);
  } else {
    for (const displayItem of displayList) {
      const li = document.createElement("li");
      const span1 = document.createElement("span");
      const span2 = document.createElement("span");
      const span3 = document.createElement("span");
      span1.textContent = displayItem["学籍番号"];
      span2.textContent = displayItem["学生氏名"];
      span3.textContent = "  ";
      li.appendChild(span1);
      li.appendChild(span3);
      li.appendChild(span2);
      ul.appendChild(li);
    }
    div.appendChild(ul);
  }
  container.appendChild(div);
}

async function handleVerify() {
  const studentsFile = students_info_element.files?.[0];
  const coursesFile = courses_info_element.files?.[0];
  const emailsFile = emails_info_element.files?.[0];
  if (!(studentsFile && coursesFile && emailsFile)) {
    let error_text = "がないみたいじゃ";
    if (!emailsFile) {
      error_text = "「メールアドレス一覧」" + error_text;
    }
    if (!coursesFile) {
      error_text = "「班別名簿」" + error_text;
    }
    if (!studentsFile) {
      error_text = "「学籍情報」" + error_text;
    }
    output.innerHTML = error_text;
    return;
  }

  const match = coursesFile.name.match(/【(.*?)】/);
  const course_name = match ? match[1] : null;

  try {
    const [studentsText, coursesBuffer, emailsBuffer] = await Promise.all([
      studentsFile.text(),
      coursesFile.arrayBuffer(),
      emailsFile.arrayBuffer()
    ]);

    const students_info_list = mitaniParseStudents(studentsText);
    if (!students_info_list) {
      output.innerHTML = "学籍情報が正しくないようじゃ";
      return;
    }
    const courses_info_list = mitaniParseCourses(coursesBuffer, course_name);
    if (!courses_info_list) {
      output.innerHTML = "班別名簿が正しくないようじゃ";
      return;
    }
    const emails_info_list = mitaniParseEmails(emailsBuffer, course_name);
    if (!emails_info_list) {
      output.innerHTML = "メールアドレス一覧が正しくないようじゃ";
      return;
    }

    console.log(students_info_list);
    console.log(courses_info_list);
    console.log(emails_info_list);

    const student_id_map = new Map(students_info_list.map(
      student_info => [student_info["学籍番号"], student_info]
    ));
    for (const course_info of courses_info_list) {
      const displayList = [];
      for (const student_id of course_info["学籍番号"]) {
        const student_info_taking_course = student_id_map.get(student_id);
        if (!student_info_taking_course) {
          output.innerHTML = "学籍情報に載っていない学生がいるようじゃ"
          return;
        }
        const enrollYear = parseInt(student_info_taking_course["入学年度"]);
        const grade = parseInt(student_info_taking_course["入学年次"]);
        if (enrollYear - grade + 1 <= 2024) {
          displayList.push(student_info_taking_course);
        }
      }
      console.log(course_info["科目番号"]);
      console.log(displayList);
      renderStudentList(course_info["科目番号"], displayList, courses_info_output)
    }
  } catch (err) {
    console.error(err);
    output.innerHTML = "ファイルの処理がうまくいかんぞ";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  verify_element.addEventListener("click", () => {
    const studentsFile = students_info_element.files?.[0];
    const coursesFile = courses_info_element.files?.[0];
    const emailsFile = emails_info_element.files?.[0];
    if (studentsFile && coursesFile && emailsFile) {
      handleVerify();
    } else {
      let error_text = "がないみたいじゃ";
      if (!emailsFile) {
        error_text = "「メールアドレス一覧」" + error_text;
      }
      if (!coursesFile) {
        error_text = "「班別名簿」" + error_text;
      }
      if (!studentsFile) {
        error_text = "「学籍情報」" + error_text;
      }
      output.innerHTML = error_text;
    }
  })
});
