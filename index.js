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
const border_year = 2024; 

function addErrorMessage(error_message_text) {
  const error_message_element = document.createElement('p');
  error_message_element.innerText = error_message_text;
  error_message.appendChild(error_message_element);
  return;
}

/**
 * @param {string} students_text
 * @returns {Array<{"学籍番号": string, "学生氏名": string, "入学年度": string, "入学年次": string}> | undefined}
 */
function mitaniParseStudents(students_text) {
  const students_list = parse(students_text, {
    columns: true,
    skip_empty_lines: true,
  });

  if (!Array.isArray(students_list)) {
    addErrorMessage("「学籍情報」のデータを解析できんぞ");
    return undefined;
  }
  const student_info_list = [];

  for (const row of students_list) {
    const student_id = row["学籍番号"];
    const student_name = row["学生氏名"];
    const enroll_year = row["入学年度"];
    const enroll_grade = row["入学年次"];

    if (
      typeof student_id !== "string" ||
      typeof student_name !== "string" ||
      typeof enroll_year !== "string" ||
      typeof enroll_grade !== "string"
    ) {
      addErrorMessage("「学籍情報」のデータが変じゃぞ");
      return undefined;
    }

    if (
      student_id.trim() === "" ||
      student_name.trim() === "" ||
      enroll_year.trim() === "" ||
      enroll_grade.trim() === ""
    ) {
      continue;
    }

    student_info_list.push({
      "学籍番号": student_id.trim(),
      "学生氏名": student_name.trim(),
      "入学年度": enroll_year.trim(),
      "入学年次": enroll_grade.trim()
    });
  }
  console.log(student_info_list);
  if (student_info_list.length === 0) {
    addErrorMessage("「学籍情報」のデータがないぞ");
    return undefined;
  }
  return student_info_list;
}

/**
 * @param {string} courses_text
 * @returns {Array<{"科目番号": string, "学籍番号": Array<string>}> | undefined}
 */
function mitaniParseCourses(courses_text) {
  const courses_list = parse(courses_text, {
    columns: true,
    skip_empty_lines: true,
  });

  if (!Array.isArray(courses_list)) {
    addErrorMessage("「履修情報」のデータを解析できんぞ");
    return undefined;
  }

  const courses_map = new Map();

  for (const row of courses_list) {
    const course_id = row["科目番号"];
    const student_id = row["学籍番号"];

    if (
      typeof course_id !== "string" ||
      typeof student_id !== "string"
    ) {
      addErrorMessage("「履修情報」のデータが変じゃぞ");
      return undefined;
    }

    if (
      course_id.trim() === "" ||
      student_id.trim() === ""
    ) {
      continue;
    }

    if (!courses_map.has(course_id.trim())) {
      courses_map.set(course_id.trim(), {
        "科目番号": course_id.trim(),
        "学籍番号": []
      });
    }
    const course_info = courses_map.get(course_id.trim());
    if (!course_info["学籍番号"].includes(student_id.trim())) {
      course_info["学籍番号"].push(student_id.trim());
    }
  } 

  const courses_info_list = Array.from(courses_map.values());
   
  console.log(courses_info_list);
  if (courses_info_list.length === 0) {
    addErrorMessage("「履修情報」のデータがないぞ");
    return undefined;
  }
  return courses_info_list;
}

function mitaniParseEmails(emails_arraybuffer, course_name) {
  let workbook;
  try {
    workbook = XLSX.read(emails_arraybuffer, { type: "array" });
  } catch (err) {
    addErrorMessage("「メールアドレス一覧」のデータが解析できんぞ");
    addErrorMessage(err);
    console.error(err);
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
  console.log(emails_info_list);
  if (emails_info_list.length === 0) {
    addErrorMessage("「メールアドレス一覧」のデータがないぞ");
    return undefined;
  }
  return emails_info_list;
}

function generateEmailContentsInfo(course_info, students_info_by_student_id, emails_info_by_course_id) {
  const student_info_taking_course_list = []
  const emails_info = emails_info_by_course_id.get(course_info["科目番号"]);
  for (const student_id of course_info["学籍番号"]) {
    if (/\d{6}5\d{2}/.test(student_id)) {
      continue;
    }
    const student_info_taking_course = students_info_by_student_id.get(student_id);
    if (!student_info_taking_course) {
      addErrorMessage(`「学籍情報」に学籍番号${student_id}の学生は載っていないようじゃ`);
      return undefined;
    }
    const enroll_year = parseInt(student_info_taking_course["入学年度"]);
    const grade = parseInt(student_info_taking_course["入学年次"]);
    if (enroll_year - grade + 1 <= border_year) {
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

function createEmailButtonElement(email_contents_info, course_name) {
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
      addErrorMessage("メールの処理に失敗しちょるぞ");
      addErrorMessage(err);
      console.error(err);
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
      error_text = "「履修情報」" + error_text;
    }
    if (!studentsFile) {
      error_text = "「学籍情報」" + error_text;
    }
    addErrorMessage(error_text);
    return;
  }

  const course_name = "情報リテラシー(演習)"

  try {
    const [students_text, courses_text, emails_arraybuffer] = await Promise.all([
      studentsFile.text(),
      coursesFile.text(),
      emailsFile.arrayBuffer()
    ]);

    const students_info_list = mitaniParseStudents(students_text);
    if (!students_info_list) {
      addErrorMessage("「学籍情報」が正しくないようじゃ");
      return;
    }
    const courses_info_list = mitaniParseCourses(courses_text);
    if (!courses_info_list) {
      addErrorMessage("「履修情報」が正しくないようじゃ");
      return;
    }
    const emails_info_list = mitaniParseEmails(emails_arraybuffer, course_name);
    if (!emails_info_list) {
      addErrorMessage("「メールアドレス一覧」が正しくないようじゃ");
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
      if (email_contents_info === undefined) {
        addErrorMessage(`科目番号${course_info["科目番号"]}のデータを作れないぞ`);
        continue;
      }
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
      td_email_button.appendChild(createEmailButtonElement(email_contents_info, course_name));
    }
    output.appendChild(table);
    const storage_key_for_table = "table";
    localStorage.setItem(storage_key_for_table, output.innerHTML);

  } catch (err) {
    addErrorMessage("ファイルの処理がうまくいかんぞ");
    addErrorMessage(err);
    console.error(err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const storage_key_for_table = "table";
  const is_already_made = localStorage.getItem(storage_key_for_table);
  if (is_already_made) {
    output.innerHTML = is_already_made;
  }

  verify_element.addEventListener("click", () => {
    while (error_message.firstChild) {
      error_message.removeChild(error_message.firstChild);  
    }
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
        error_text = "「履修情報」" + error_text;
      }
      if (!studentsFile) {
        error_text = "「学籍情報」" + error_text;
      }
      addErrorMessage(error_text);
    }
  })
});
