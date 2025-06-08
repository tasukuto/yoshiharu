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
const error_message = mustGetElementById("error_message");
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
    .filter(row => row[1] === course_name)
    .map(row => ({
      "科目番号": row[0],
      "担当教員": row[8],
      "アドレス": row[9]
    }));
  return emails_info_list;
}

function generateEmailContentsInfo(course_info, students_info_by_student_id, emails_info_by_course_id) {
  const student_info_taking_course_list = []
  const emails_info = emails_info_by_course_id.get(course_info["科目番号"]);
  for (const student_id of course_info["学籍番号"]) {
    const student_info_taking_course = students_info_by_student_id.get(student_id);
    if (!student_info_taking_course) {
      error_message.innerHTML += `${student_id}は学籍情報に載っていない学生のようじゃ\n`
      return undefined;
    }
    const enrollYear = parseInt(student_info_taking_course["入学年度"]);
    const grade = parseInt(student_info_taking_course["入学年次"]);
    if (enrollYear - grade + 1 <= 2024) {
      student_info_taking_course_list.push(student_info_taking_course);
    }
  }
  const email_contents_info = {
    "科目番号": course_info["科目番号"],
    "担当教員": emails_info["担当教員"],
    "アドレス": emails_info["アドレス"],
    "学生情報": student_info_taking_course_list
  }
  return email_contents_info;
}

function createEmailBody(email_contents_info, course_name) {
  const course_id = email_contents_info["科目番号"];
  const teacher = email_contents_info["担当教員"];
  const email_address = email_contents_info["アドレス"];
  const student_info = email_contents_info["学生情報"];

  const student_info_list_text = student_info.map(
    s => `${s["学籍番号"]}　${s["学生氏名"]}`
  ).join("\n");

  return `
${teacher}先生

${course_name}（科目番号：${course_id}）について、A+～D評価で成績評価される学生がいます。
該当する学生は以下の通りです。ご確認ください。

${student_info_list_text}

よろしくお願いいたします。
  `.trim();
}

function createEmailBottunElement(email_contents_info, course_name) {
  const course_id = email_contents_info["科目番号"];
  const email_address = email_contents_info["アドレス"];
  const email_body = createEmailBody(email_contents_info, course_name);
  const email_subject = `【${email_contents_info["科目番号"]}】${course_name}履修者の評価方法の確認のお願い`

  const storage_key_for_button = `email_sent_${course_id}`;
  const storage_key_for_table = "table";  
  const is_already_sent = localStorage.getItem(storage_key_for_button) === "true";
  
  const button = document.createElement("button");
  button.textContent = is_already_sent ? `送信済！！！` : `メールする`;

  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(email_body);

      window.location.href = `mailto:${encodeURIComponent(email_address)}?subject=${encodeURIComponent(email_subject)}`;

      localStorage.setItem(storage_key_for_button, "true");
      button.textContent = `送信済！！！`;
      localStorage.setItem(storage_key_for_table, output.innerHTML);
    } catch (err) {
      console.error("メール処理エラー:", err);
    }
  });

  return button;
}

async function handleVerify() {
  const studentsFile = students_info_element.files?.[0];
  const coursesFile = courses_info_element.files?.[0];
  const emailsFile = emails_info_element.files?.[0];
  if (!(studentsFile && coursesFile && emailsFile)) {
    let error_text = "がないみたいじゃ\n";
    if (!emailsFile) {
      error_text = "「メールアドレス一覧」" + error_text;
    }
    if (!coursesFile) {
      error_text = "「班別名簿」" + error_text;
    }
    if (!studentsFile) {
      error_text = "「学籍情報」" + error_text;
    }
    error_message.innerHTML += error_text;
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
      error_message.innerHTML += "「学籍情報」が正しくないようじゃ\n";
      return;
    }
    const courses_info_list = mitaniParseCourses(coursesBuffer, course_name);
    if (!courses_info_list) {
      error_message.innerHTML += "「班別名簿」が正しくないようじゃ\n";
      return;
    }
    const emails_info_list = mitaniParseEmails(emailsBuffer, course_name);
    if (!emails_info_list) {
      error_message.innerHTML += "「メールアドレス一覧」が正しくないようじゃ\n";
      return;
    }
    const students_info_by_student_id = new Map(students_info_list.map(
      student_info => [student_info["学籍番号"], student_info]
    ));
    const emails_info_by_course_id = new Map(emails_info_list.map(
      emails_info => [emails_info["科目番号"], emails_info]
    ));

    const email_contents_info_list = [];
    for (const course_info of courses_info_list) {
      const email_contents_info = generateEmailContentsInfo(course_info, students_info_by_student_id, emails_info_by_course_id);
      console.log(email_contents_info);
      if (email_contents_info["学生情報"].length > 0) {
        email_contents_info_list.push(email_contents_info);
      }
    }
    console.log(email_contents_info_list);
    const announcement = document.createElement('h2');
    announcement.textContent = `${course_name}の2024年度以下の学生`;
    output.appendChild(announcement);

    const table = document.createElement("table");
    table.border = "1";
    table.style.borderCollapse = "collapse";
    const header = table.insertRow();
    ["科目番号", "担当教員", "メールアドレス"].forEach(text => {
      const th = document.createElement("th");
      th.textContent = text;
      th.style.padding = "10px";
      header.appendChild(th);
    });
    for (const email_contents_info of email_contents_info_list) {
      const row = table.insertRow();
      const td_course_id = row.insertCell();
      td_course_id.textContent = email_contents_info["科目番号"];
      const td_teacher = row.insertCell();
      td_teacher.textContent = email_contents_info["担当教員"];
      const td_email_button = row.insertCell();
      td_email_button.appendChild(createEmailBottunElement(email_contents_info, course_name));
    }
    output.appendChild(table);
    const storage_key_for_table = "table";
    localStorage.setItem(storage_key_for_table, output.innerHTML);

  } catch (err) {
    console.error(err);
    error_message.innerHTML += "ファイルの処理がうまくいかんぞ\n";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const storage_key_for_table = "table";
  const is_already_made = localStorage.getItem(storage_key_for_table);
  if (is_already_made) {
    output.innerHTML = is_already_made;
  }

  verify_element.addEventListener("click", () => {
    error_message.innerHTML = "";
    while (output.firstChild) {
      output.removeChild(output.firstChild);
    }
    const studentsFile = students_info_element.files?.[0];
    const coursesFile = courses_info_element.files?.[0];
    const emailsFile = emails_info_element.files?.[0];
    if (studentsFile && coursesFile && emailsFile) {
      handleVerify();
    } else {
      let error_text = "がないみたいじゃ\n";
      if (!emailsFile) {
        error_text = "「メールアドレス一覧」" + error_text;
      }
      if (!coursesFile) {
        error_text = "「班別名簿」" + error_text;
      }
      if (!studentsFile) {
        error_text = "「学籍情報」" + error_text;
      }
      error_message.innerHTML += error_text;
    }
  })
});
