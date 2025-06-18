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
const email_cc_address_element = mustGetElementById("email_cc_address_element");
const email_body_element = mustGetElementById("email_body_element");
const verify_element = mustGetElementById("verify_element");
const error_message = mustGetElementById("error_message");
const output = mustGetElementById("output");

const border_year = 2024;
const course_name = "情報リテラシー(演習)";

function addErrorMessage(error_message_text) {
  const error_message_element = document.createElement('p');
  error_message_element.innerText = error_message_text;
  error_message.appendChild(error_message_element);
  return;
}

function isStudentID(student_id) {
  if (/^20\d{7}$/.test(student_id)) return true;
  else return false;
}

function isCourseID(course_id) {
  if (/^\d{7}$/.test(course_id)) return true;
  else return false;
}

function isIrregularStudentID(student_id) {
  if (/\d{6}5\d{2}/.test(student_id)) return true;
  else return false;
}

function loadEmailandTableFromStorage() {
  const storage_key_for_table = "table";
  const is_already_made = localStorage.getItem(storage_key_for_table);
  if (is_already_made) output.innerHTML = is_already_made;

  const storage_key_for_email_cc_address = "cc_address";
  const is_already_written_cc_address = localStorage.getItem(storage_key_for_email_cc_address);
  if (is_already_written_cc_address) email_cc_address_element.value = is_already_written_cc_address;

  const storage_key_for_email_subject = "subject";
  const is_already_written_subject = localStorage.getItem(storage_key_for_email_subject);
  if (is_already_written_subject) email_subject_element.value = is_already_written_subject;
  
  const storage_key_for_email_body = "body";
  const is_already_written_body = localStorage.getItem(storage_key_for_email_body);
  if (is_already_written_body) email_body_element.value = is_already_written_body;
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

  const students_info_list = [];
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
    if (!isStudentID(student_id)) {
      addErrorMessage(`学籍番号${student_id}}は正しい番号じゃないぞ`);
      return undefined;
    }
    students_info_list.push({
      "学籍番号": student_id,
      "学生氏名": student_name.trim(),
      "入学年度": enroll_year.trim(),
      "入学年次": enroll_grade.trim()
    });
  }

  if (students_info_list.length === 0) {
    addErrorMessage("「学籍情報」のデータがないぞ");
    return undefined;
  }
  console.log("students_info_list");
  console.log(students_info_list);
  return students_info_list;
}

function mitaniParseCourses(courses_text) {
  const courses_list = parse(courses_text, {
    columns: true,
    skip_empty_lines: true,
  });
  if (!Array.isArray(courses_list)) {
    addErrorMessage("「履修情報」のデータを解析できんぞ");
    return undefined;
  }

  const courses_info_list = [];
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
    ) continue;
    if (!isStudentID(student_id)) {
      addErrorMessage(`学籍番号${student_id}}は正しい番号じゃないぞ`);
      return undefined;
    }
    if (!isCourseID(course_id)) {
      addErrorMessage(`科目番号${course_id}は正しい番号じゃないぞ`);
      return undefined;
    }
    courses_info_list.push({
      "科目番号": course_id,
      "学籍番号": student_id
    });
  } 
   
  if (courses_info_list.length === 0) {
    addErrorMessage("「履修情報」のデータがないぞ");
    return undefined;
  }
  console.log("courses_info_list");
  console.log(courses_info_list);
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
      "実施学期": row[5],
      "担当教員": row[8],
      "アドレス": row[9]
    }));

  if (emails_info_list.length === 0) {
    addErrorMessage("「メールアドレス一覧」のデータがないぞ");
    return undefined;
  }
  console.log("emails_info_list");
  console.log(emails_info_list);
  return emails_info_list;
}

function generateEmailContentsInfo(courses_info_by_course_id, students_info_map_by_student_id, emails_info_map_by_course_id) {
  const student_info_taking_course_list = [];
  const course_id = courses_info_by_course_id["科目番号"];
  console.log("course_id");
  console.log(course_id);
  const emails_info = emails_info_map_by_course_id.get(course_id);
  console.log("emails_info");
  console.log(emails_info);
  const courses_info = courses_info_by_course_id.content;
  console.log("courses_info");
  console.log(courses_info);
  for (const course_info of courses_info) {
    const student_id = course_info["学籍番号"];
    if (isIrregularStudentID(student_id)) continue;
    const student_info_taking_course = students_info_map_by_student_id.get(student_id);
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
    "実施学期": emails_info["実施学期"],
    "科目番号": course_id,
    "担当教員": emails_info["担当教員"],
    "アドレス": emails_info["アドレス"],
    "学生情報": student_info_taking_course_list
  }
  return email_contents_info;
}

function generateListGroupedby(column_name, list) {
  const list_map = new Map();
  for (const element of list) {
    const column_value = element[column_name];
    if (!list_map.has(column_value)) {
      list_map.set(column_value, {
        [column_name]: column_value,
        content: []
      });
    }
    const list_of_column = list_map.get(column_value);
    list_of_column.content.push(element);
  }
  console.log(`grouped list of ${column_name}`);  
  console.log(Array.from(list_map.values()));
  return Array.from(list_map.values());
}

function generateEmailVariableInfo(term_name, course_name, email_contents_info) {
  const student_info = email_contents_info["学生情報"];
  const student_info_list_text = student_info.map(
    s => `${s["学籍番号"]}　${s["学生氏名"]}`
  ).join("\n");

  return {
    term_name: term_name,
    course_name: course_name,
    course_id: email_contents_info["科目番号"],
    teacher_name: email_contents_info["担当教員"],
    email_address: email_contents_info["アドレス"],
    student_info: student_info_list_text
  }
}

function getEmailCcAddress() {
  const email_cc_address_element_latest = mustGetElementById("email_cc_address_element");
  const storage_key_for_cc_address = "cc_address";
  localStorage.setItem(storage_key_for_cc_address, email_cc_address_element_latest.value);
  return email_cc_address_element_latest.value;
}

function replaceEmailVariable(input_text, email_variable_info) {
  return input_text.replace(/\$[a-zA-Z]*_[a-zA-Z]*/g, (match) => {
    const key = match.slice(1);
    return email_variable_info.hasOwnProperty(key) ? email_variable_info[key] : match;
  });
}

function createEmailSubject(email_variable_info) {
  console.log("email_subject_element");
  console.log(email_subject_element);
  const email_subject_element_latest = mustGetElementById("email_subject_element");
  const storage_key_for_email_subject = "subject";
  localStorage.setItem(storage_key_for_email_subject, email_subject_element_latest.value);
  console.log("email_subject_element_latest");
  console.log(email_subject_element_latest);
  return replaceEmailVariable(email_subject_element_latest.value, email_variable_info);
}

function createEmailBody(email_variable_info) {
  console.log("email_body_element");
  console.log(email_body_element);
  const email_body_element_latest = mustGetElementById("email_body_element");
  const storage_key_for_email_body = "body";
  localStorage.setItem(storage_key_for_email_body, email_body_element_latest.value);
  console.log("email_body_element_latest");
  console.log(email_body_element_latest);
  return replaceEmailVariable(email_body_element_latest.value, email_variable_info);
}

function createEmailButtonElement(email_variable_info) {
  const course_id = email_variable_info.course_id;
  const email_address = email_variable_info.email_address;
  const email_cc_address = getEmailCcAddress();
  const email_subject = createEmailSubject(email_variable_info);
  const email_body = createEmailBody(email_variable_info);

  const storage_key_for_button = `email_sent_${course_id}`;
  const storage_key_for_table = "table";  
  const is_already_sent = localStorage.getItem(storage_key_for_button) === "true";
  
  const button = document.createElement("button");
  button.textContent = is_already_sent ? `送信済！！！` : `メールする`;

  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(email_body);

      window.location.href = `mailto:${encodeURIComponent(email_address)}?cc=${encodeURIComponent(email_cc_address)}&subject=${encodeURIComponent(email_subject)}`;

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
  const students_file = students_info_element.files?.[0];
  const courses_file = courses_info_element.files?.[0];
  const emails_file = emails_info_element.files?.[0];
  if (!(students_file && courses_file && emails_file)) {
    let error_text = "がないみたいじゃ\n";
    if (!emails_file) {
      error_text = "「メールアドレス一覧」" + error_text;
    }
    if (!courses_file) {
      error_text = "「履修情報」" + error_text;
    }
    if (!students_file) {
      error_text = "「学籍情報」" + error_text;
    }
    addErrorMessage(error_text);
    return;
  }

  try {
    const [students_text, courses_text, emails_arraybuffer] = await Promise.all([
      students_file.text(),
      courses_file.text(),
      emails_file.arrayBuffer()
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
    const courses_info_list_by_course_id = generateListGroupedby("科目番号", courses_info_list);
    const emails_info_list = mitaniParseEmails(emails_arraybuffer, course_name);
    if (!emails_info_list) {
      addErrorMessage("「メールアドレス一覧」が正しくないようじゃ");
      return;
    }
    const students_info_map_by_student_id = new Map(students_info_list.map(
      student_info => [student_info["学籍番号"], student_info]
    ));
    const emails_info_map_by_course_id = new Map(emails_info_list.map(
      emails_info => [emails_info["科目番号"], emails_info]
    ));

    const email_contents_info_list = [];
    for (const courses_info_by_course_id of courses_info_list_by_course_id) {
      const email_contents_info = generateEmailContentsInfo(courses_info_by_course_id, students_info_map_by_student_id, emails_info_map_by_course_id);
      if (email_contents_info === undefined) {
        addErrorMessage(`科目番号${course_info["科目番号"]}のデータを作れないぞ`);
        continue;
      }
      console.log("email_contents_info");
      console.log(email_contents_info);
      if (email_contents_info["学生情報"].length > 0) {
        email_contents_info_list.push(email_contents_info);
      }
    }
    console.log("email_contents_info_list");
    console.log(email_contents_info_list);
    const email_contents_info_list_by_term = generateListGroupedby("実施学期", email_contents_info_list);
    console.log("email_contents_info_list_by_term");
    console.log(email_contents_info_list_by_term);
    const announcement = document.createElement('h2');
    announcement.textContent = `${course_name}の「評語評価（A＋～D）」対象の学生`;
    output.appendChild(announcement);

    for (const email_contents_info_by_term of email_contents_info_list_by_term) {
      const announcement = document.createElement('h3');
      const term_name = email_contents_info_by_term["実施学期"];
      announcement.textContent = `${term_name}`;
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
      for (const email_contents_info of email_contents_info_by_term.content) {
        const course_id = email_contents_info["科目番号"];
        const row = table.insertRow();
        const td_course_id = row.insertCell();
        td_course_id.textContent = course_id;
        const td_teacher = row.insertCell();
        td_teacher.textContent = email_contents_info["担当教員"];
        const td_email_button = row.insertCell();
        const email_variable_info = generateEmailVariableInfo(term_name, course_name, email_contents_info);
        td_email_button.appendChild(createEmailButtonElement(email_variable_info));
      }
      output.appendChild(table);
    }
    const storage_key_for_table = "table";
    localStorage.setItem(storage_key_for_table, output.innerHTML);

  } catch (err) {
    addErrorMessage("ファイルの処理がうまくいかんぞ");
    addErrorMessage(err);
    console.error(err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadEmailandTableFromStorage();

  verify_element.addEventListener("click", () => {
    while (error_message.firstChild) {
      error_message.removeChild(error_message.firstChild);  
    }
    while (output.firstChild) {
      output.removeChild(output.firstChild);
    }
    const students_file = students_info_element.files?.[0];
    const courses_file = courses_info_element.files?.[0];
    const emails_file = emails_info_element.files?.[0];
    if (students_file && courses_file && emails_file) {
      handleVerify();
    } else {
      let error_text = "がないみたいじゃ\n";
      if (!emails_file) {
        error_text = "「メールアドレス一覧」" + error_text;
      }
      if (!courses_file) {
        error_text = "「履修情報」" + error_text;
      }
      if (!students_file) {
        error_text = "「学籍情報」" + error_text;
      }
      addErrorMessage(error_text);
    }
  })
});
