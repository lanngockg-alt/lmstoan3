/**
 * ==========================================
 * LMS API & DATABASE SCRIPT (Google Apps Script)
 * ==========================================
 * 
 * HƯỚNG DẪN DEPLOY (TRIỂN KHAI):
 * 1. Nhấn nút "Deploy" (Triển khai) > "New deployment" (Tùy chọn triển khai mới).
 * 2. Chọn loại: "Web app" (Ứng dụng web).
 * 3. Description: "LMS API v1".
 * 4. Execute as: "Me" (Tôi).
 * 5. Who has access: "Anyone" (Bất kỳ ai).
 * 6. Nhấn "Deploy".
 * 7. Copy "Web App URL" (URL ứng dụng web) và dán vào file .env của dự án React (VITE_API_URL).
 * 
 * CÁCH TEST (Postman/Fetch):
 * - Method: POST
 * - URL: <Web App URL>
 * - Body (Raw JSON):
 *   {
 *     "action": "classes.list",
 *     "payload": {}
 *   }
 */

// --- 1. Web API Entry Point (doPost) ---

function doPost(e) {
  const lock = LockService.getScriptLock();
  
  // Thử lấy khóa trong 10 giây
  if (!lock.tryLock(10000)) {
    return responseJSON({ ok: false, error: "Máy chủ đang bận. Vui lòng thử lại sau vài giây." });
  }

  try {
    // CORS Handling
    if (!e || !e.postData || !e.postData.contents) {
      return responseJSON({ ok: false, error: "No data received" });
    }

    const request = JSON.parse(e.postData.contents);
    const action = request.action;
    const payload = request.payload || {};
    
    console.log(`[API] Action: ${action}`, JSON.stringify(payload)); // Log request

    let data = null;

    switch (action) {
      // --- AUTH ---
      case 'auth.login': data = handleLogin(payload); break;

      // --- USERS (Học sinh/Giáo viên) ---
      // Fields: id, username, password, fullName, role, classId, avatar, dob, parentPhone
      case 'users.get': data = db.findById('Users', payload.id); break;
      case 'students.list': 
        const students = db.find('Users', { role: 'STUDENT' });
        data = payload.classId ? students.filter(s => s.classId === payload.classId) : students;
        break;
      case 'students.add': data = handleAddStudent(payload); break;
      case 'teachers.add': data = handleAddTeacher(payload); break; // New Action
      case 'students.update': data = db.update('Users', payload.id, payload); break;
      case 'students.delete': data = { success: db.delete('Users', payload.id) }; break;

      // --- CLASSES (Lớp học) ---
      // Fields: id, name, academicYear, joinCode, teacherId
      case 'classes.list': data = db.findAll('Classes'); break;
      case 'classes.create': data = db.insert('Classes', payload); break;
      case 'classes.update': data = db.update('Classes', payload.id, payload); break;
      case 'classes.delete': data = { success: db.delete('Classes', payload.id) }; break;

      // --- SUBJECTS (Môn học) ---
      // Fields: id, name, description
      case 'subjects.list': data = db.findAll('Subjects'); break;
      case 'subjects.create': data = db.insert('Subjects', payload); break;
      case 'subjects.update': data = db.update('Subjects', payload.id, payload); break;
      case 'subjects.delete': data = { success: db.delete('Subjects', payload.id) }; break;

      // --- MODULES (Chủ đề) ---
      // Fields: id, subjectId, name, description, order, isActive
      case 'modules.list': data = db.findAll('Modules').sort((a, b) => a.order - b.order); break;
      case 'modules.create': data = db.insert('Modules', payload); break;
      case 'modules.update': data = db.update('Modules', payload.id, payload); break;
      case 'modules.delete': data = { success: db.delete('Modules', payload.id) }; break;

      // --- LESSONS (Bài giảng/Bài học) ---
      // Fields: id, moduleId, title, content, videoUrl, thumbnail, status, order
      case 'lessons.list': data = db.findAll('Lessons').sort((a, b) => a.order - b.order); break;
      case 'lessons.create': data = db.insert('Lessons', payload); break;
      case 'lessons.update': data = db.update('Lessons', payload.id, payload); break;
      case 'lessons.delete': data = { success: db.delete('Lessons', payload.id) }; break;

      // --- RESOURCES (Tài liệu) ---
      // Fields: id, lessonId, type, title, url, isMandatory, order
      case 'resources.list': data = db.findAll('Resources').sort((a, b) => a.order - b.order); break;
      case 'resources.create': data = db.insert('Resources', payload); break;
      case 'resources.delete': data = { success: db.delete('Resources', payload.id) }; break;

      // --- ASSIGNMENTS (Bài tập) ---
      // Fields: id, lessonId, title, description, dueDate, maxStars, optionsJson, attachmentUrl
      case 'assignments.list': data = db.findAll('Assignments'); break;
      case 'assignments.create': data = db.insert('Assignments', payload); break;
      case 'assignments.update': data = db.update('Assignments', payload.id, payload); break;
      case 'assignments.delete': data = { success: db.delete('Assignments', payload.id) }; break;

      // --- EVALUATIONS (Sổ đánh giá) ---
      // Fields: id, studentId, assignmentId, grade, teacherFeedback, rubricJson, starsAwarded, status
      case 'evaluations.list': 
        if (payload.studentId || payload.assignmentId) {
          data = db.find('Evaluations', payload);
        } else {
          data = db.findAll('Evaluations');
        }
        break;
      case 'evaluations.add': data = handleAddEvaluation(payload); break;
      case 'evaluations.grade': data = handleGradeSubmission(payload); break;
      case 'evaluations.batchUpdate': data = handleBatchEvaluations(payload); break; // New Batch Action
      case 'submissions.grade': data = handleGradeSubmission(payload); break; // Alias for submissions.grade

      // --- PROGRESS (Tiến độ) ---
      // Fields: id, studentId, resourceId, isCompleted, completedAt
      case 'progress.list': data = db.find('Progress', { studentId: payload.studentId }); break;
      case 'progress.update': data = handleUpdateProgress(payload); break;

      // --- ANNOUNCEMENTS (Thông báo) ---
      // Fields: id, classId, target, title, content, authorId
      case 'announcements.list': 
        const allAnnounce = db.findAll('Announcements');
        data = payload.classId 
          ? allAnnounce.filter(a => a.classId === payload.classId || a.target === 'ALL')
          : allAnnounce;
        break;
      case 'announcements.create': data = db.insert('Announcements', payload); break;
      case 'announcements.delete': data = { success: db.delete('Announcements', payload.id) }; break;

      // --- SYSTEM ---
      case 'setup': data = { message: setupDatabase() }; break;

      default: throw new Error(`Action '${action}' không tồn tại.`);
    }

    return responseJSON({ ok: true, data: data });

  } catch (err) {
    return responseJSON({ ok: false, error: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return responseJSON({ 
    ok: true, 
    message: "LMS API v2 is running...", 
    timestamp: new Date().toISOString(),
    guide: "POST to this URL with { action: '...', payload: ... }"
  });
}

function responseJSON(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// --- 2. Business Logic ---

function handleLogin({ username, password }) {
  let users = db.findAll('Users');
  
  // Auto-seed if no users exist (Safety net)
  if (users.length === 0) {
    seedData();
    users = db.findAll('Users');
  }

  const cleanUser = String(username).trim();
  const cleanPass = String(password).trim();

  const user = users.find(u => 
    String(u.username).trim() === cleanUser && 
    String(u.password).trim() === cleanPass
  );

  if (!user) {
    // Debug log for Apps Script Dashboard
    console.warn(`Login failed. Input: ${cleanUser}/${cleanPass}. DB has: ${users.length} users.`);
    throw new Error("Sai tên đăng nhập hoặc mật khẩu! (Vui lòng kiểm tra lại Username/Password trong Sheet 'Users')");
  }

  const { password: _, ...userInfo } = user;
  return userInfo;
}

function handleAddStudent(payload) {
  if (!payload.fullName || !payload.username) throw new Error("Thiếu tên hoặc username");
  const existing = db.find('Users', { username: payload.username });
  if (existing.length > 0) throw new Error("Tên đăng nhập đã tồn tại!");
  payload.role = 'STUDENT';
  payload.password = payload.password || '123456'; 
  return db.insert('Users', payload);
}

function handleAddTeacher(payload) {
  if (!payload.fullName || !payload.username) throw new Error("Thiếu tên hoặc username");
  const existing = db.find('Users', { username: payload.username });
  if (existing.length > 0) throw new Error("Tên đăng nhập đã tồn tại!");
  payload.role = 'TEACHER';
  payload.password = payload.password || '123456'; 
  return db.insert('Users', payload);
}

function handleAddEvaluation(payload) {
  // Logic học sinh nộp bài
  return db.insert('Evaluations', { ...payload, status: 'SUBMITTED', submittedAt: new Date().toISOString() });
}

function handleGradeSubmission(payload) {
  // Logic giáo viên chấm bài
  if (!payload.id) throw new Error("Thiếu ID bài nộp");
  
  return db.update('Evaluations', payload.id, {
    grade: payload.grade,
    teacherFeedback: payload.teacherFeedback,
    assessmentLevel: payload.assessmentLevel,
    starsAwarded: payload.starsEarned,
    rubricJson: payload.rubricJson, // Lưu tiêu chí chấm
    submissionUrl: payload.submissionUrl, // Cập nhật link minh chứng nếu có
    status: 'GRADED',
    updatedAt: new Date().toISOString()
  });
}

function handleBatchEvaluations(payload) {
  const evaluations = payload.evaluations;
  if (!Array.isArray(evaluations)) throw new Error("Payload phải là một mảng evaluations");

  const sheet = db.getSheet('Evaluations');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  // Map column names to indices
  const colMap = {};
  headers.forEach((h, i) => colMap[h] = i);

  let updatedCount = 0;
  const now = new Date().toISOString();

  evaluations.forEach(item => {
    // 1. Check if submission exists (by ID or Student+Assignment)
    let rowIndex = -1;
    
    if (item.submissionId) {
       // Find by ID
       for (let i = 1; i < data.length; i++) {
         if (data[i][colMap['id']] == item.submissionId) {
           rowIndex = i + 1;
           break;
         }
       }
    } else {
       // Find by Student + Assignment
       for (let i = 1; i < data.length; i++) {
         if (data[i][colMap['studentId']] == item.studentId && 
             data[i][colMap['assignmentId']] == item.assignmentId) {
           rowIndex = i + 1;
           break;
         }
       }
    }

    // 2. Prepare Data Row
    if (rowIndex > -1) {
      // UPDATE
      // Update specific columns: assessmentLevel, teacherComment, submissionUrl, grade, starsAwarded, status, updatedAt
      // Note: teacherComment maps to teacherFeedback in DB based on user request/schema mismatch resolution
      // User asked for 'teacherComment' column, schema has 'teacherComment' AND 'teacherFeedback'.
      // We will save to 'teacherComment' as requested, and sync 'teacherFeedback' just in case.
      
      const rowNum = rowIndex;
      
      if (colMap['assessmentLevel'] !== undefined) sheet.getRange(rowNum, colMap['assessmentLevel'] + 1).setValue(item.assessmentLevel);
      if (colMap['teacherComment'] !== undefined) sheet.getRange(rowNum, colMap['teacherComment'] + 1).setValue(item.teacherComment);
      if (colMap['teacherFeedback'] !== undefined) sheet.getRange(rowNum, colMap['teacherFeedback'] + 1).setValue(item.teacherComment); // Sync
      if (colMap['submissionUrl'] !== undefined && item.submissionUrl) sheet.getRange(rowNum, colMap['submissionUrl'] + 1).setValue(item.submissionUrl);
      if (colMap['grade'] !== undefined) sheet.getRange(rowNum, colMap['grade'] + 1).setValue(item.grade);
      if (colMap['starsAwarded'] !== undefined) sheet.getRange(rowNum, colMap['starsAwarded'] + 1).setValue(item.starsEarned);
      if (colMap['status'] !== undefined) sheet.getRange(rowNum, colMap['status'] + 1).setValue('GRADED');
      if (colMap['updatedAt'] !== undefined) sheet.getRange(rowNum, colMap['updatedAt'] + 1).setValue(now);
      
    } else {
      // INSERT NEW
      const newId = Utilities.getUuid();
      const newRow = headers.map(h => {
        switch(h) {
          case 'id': return newId;
          case 'studentId': return item.studentId;
          case 'assignmentId': return item.assignmentId;
          case 'submissionUrl': return item.submissionUrl || '';
          case 'submittedAt': return now; // Auto submit
          case 'assessmentLevel': return item.assessmentLevel;
          case 'teacherComment': return item.teacherComment || '';
          case 'teacherFeedback': return item.teacherComment || ''; // Sync
          case 'starsAwarded': return item.starsEarned || 0;
          case 'status': return 'GRADED';
          case 'grade': return item.grade || 10;
          case 'createdAt': return now;
          case 'updatedAt': return now;
          default: return '';
        }
      });
      sheet.appendRow(newRow);
    }
    updatedCount++;
  });

  return { success: true, count: updatedCount };
}

function handleUpdateProgress(payload) {
  const { studentId, resourceId, isCompleted } = payload;
  const existing = db.find('Progress', { studentId, resourceId });
  
  if (existing.length > 0) {
    return db.update('Progress', existing[0].id, { isCompleted, completedAt: isCompleted ? new Date().toISOString() : '' });
  } else {
    return db.insert('Progress', { studentId, resourceId, isCompleted, completedAt: isCompleted ? new Date().toISOString() : '' });
  }
}

// --- 3. Database Layer ---

const db = {
  getSpreadsheet: function() { return SpreadsheetApp.getActiveSpreadsheet(); },
  getSheet: function(name) {
    const sheet = this.getSpreadsheet().getSheetByName(name);
    if (!sheet) throw new Error(`Không tìm thấy Sheet: ${name}`);
    return sheet;
  },
  getHeaders: function(sheet) { return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]; },
  rowToObject: function(row, headers) {
    const obj = {};
    headers.forEach((header, i) => obj[header] = row[i]);
    return obj;
  },
  objectToRow: function(obj, headers) {
    return headers.map(header => {
      if (header === 'createdAt' || header === 'updatedAt') return obj[header] || new Date().toISOString();
      return obj[header] === undefined ? '' : obj[header];
    });
  },
  findAll: function(sheetName) {
    const sheet = this.getSheet(sheetName);
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) return [];
    const data = sheet.getRange(1, 1, lastRow, sheet.getLastColumn()).getValues();
    const headers = data.shift();
    return data.map(row => this.rowToObject(row, headers));
  },
  findById: function(sheetName, id) {
    return this.findAll(sheetName).find(item => item.id == id) || null;
  },
  find: function(sheetName, criteria) {
    return this.findAll(sheetName).filter(item => Object.keys(criteria).every(key => item[key] == criteria[key]));
  },
  insert: function(sheetName, data) {
    const sheet = this.getSheet(sheetName);
    const headers = this.getHeaders(sheet);
    if (!data.id) data.id = Utilities.getUuid();
    const now = new Date().toISOString();
    data.createdAt = now;
    data.updatedAt = now;
    sheet.appendRow(this.objectToRow(data, headers));
    return data;
  },
  update: function(sheetName, id, updates) {
    const sheet = this.getSheet(sheetName);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idIndex = headers.indexOf('id');
    let rowIndex = -1;
    let currentData = {};
    for (let i = 1; i < data.length; i++) {
      if (data[i][idIndex] == id) {
        rowIndex = i + 1;
        currentData = this.rowToObject(data[i], headers);
        break;
      }
    }
    if (rowIndex === -1) throw new Error(`Không tìm thấy ID ${id} trong ${sheetName}`);
    const newData = { ...currentData, ...updates, updatedAt: new Date().toISOString() };
    sheet.getRange(rowIndex, 1, 1, headers.length).setValues([this.objectToRow(newData, headers)]);
    return newData;
  },
  delete: function(sheetName, id) {
     const sheet = this.getSheet(sheetName);
     const data = sheet.getDataRange().getValues();
     const headers = data[0];
     const idIndex = headers.indexOf('id');
     for (let i = 1; i < data.length; i++) {
       if (data[i][idIndex] == id) {
         sheet.deleteRow(i + 1);
         return true;
       }
     }
     return false;
  }
};

// --- 4. Setup ---

const SCHEMA = {
  Users: ['id', 'username', 'password', 'fullName', 'role', 'classId', 'avatar', 'dob', 'parentPhone', 'createdAt', 'updatedAt'],
  Classes: ['id', 'name', 'teacherId', 'academicYear', 'joinCode', 'createdAt', 'updatedAt'],
  Subjects: ['id', 'name', 'description', 'createdAt', 'updatedAt'],
  Modules: ['id', 'subjectId', 'name', 'description', 'order', 'isActive', 'createdAt', 'updatedAt'],
  Lessons: ['id', 'moduleId', 'title', 'content', 'thumbnail', 'videoUrl', 'order', 'status', 'createdAt', 'updatedAt'],
  Resources: ['id', 'lessonId', 'type', 'title', 'url', 'isMandatory', 'order', 'createdAt', 'updatedAt'],
  Assignments: ['id', 'lessonId', 'title', 'description', 'dueDate', 'attachmentUrl', 'maxStars', 'optionsJson', 'createdAt', 'updatedAt'],
  Evaluations: ['id', 'studentId', 'assignmentId', 'submissionUrl', 'submittedAt', 'assessmentLevel', 'teacherComment', 'starsAwarded', 'status', 'grade', 'teacherFeedback', 'rubricJson', 'createdAt', 'updatedAt'],
  Progress: ['id', 'studentId', 'resourceId', 'isCompleted', 'completedAt', 'createdAt', 'updatedAt'],
  Announcements: ['id', 'classId', 'target', 'title', 'content', 'authorId', 'createdAt', 'updatedAt']
};

function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  for (const [name, headers] of Object.entries(SCHEMA)) {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      sheet.appendRow(headers);
      sheet.setFrozenRows(1);
    } else {
      // Check if headers match, if not, append missing headers (simple migration)
      const currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      const missingHeaders = headers.filter(h => !currentHeaders.includes(h));
      if (missingHeaders.length > 0) {
        // Append missing headers to the first row
        const lastCol = sheet.getLastColumn();
        sheet.getRange(1, lastCol + 1, 1, missingHeaders.length).setValues([missingHeaders]);
      }
    }
  }
  
  // Auto seed if empty
  if (db.findAll('Users').length === 0) {
    seedData();
  }
  
  return "Đã khởi tạo database thành công!";
}

function seedData() {
  const now = new Date().toISOString();
  
  // 1. Users (Admin & Student)
  if (db.findAll('Users').length === 0) {
    const admin = { id: 'u1', username: 'admin', password: '123', fullName: 'Admin Teacher', role: 'TEACHER', classId: '', avatar: '', dob: '', parentPhone: '', createdAt: now, updatedAt: now };
    const student = { id: 's1', username: 'student', password: '123', fullName: 'Nguyen Van A', role: 'STUDENT', classId: 'c1', avatar: '', dob: '2015-01-01', parentPhone: '0901234567', createdAt: now, updatedAt: now };
    db.insert('Users', admin);
    db.insert('Users', student);
  }

  // 2. Classes
  if (db.findAll('Classes').length === 0) {
    db.insert('Classes', { id: 'c1', name: 'Lớp 3A', teacherId: 'u1', academicYear: '2023-2024', joinCode: 'CLASS3A', createdAt: now, updatedAt: now });
  }

  // 3. Subjects
  if (db.findAll('Subjects').length === 0) {
    db.insert('Subjects', { id: 'sub1', name: 'Toán Học', description: 'Môn Toán lớp 3', createdAt: now, updatedAt: now });
  }

  // 4. Modules (Topics)
  if (db.findAll('Modules').length === 0) {
    db.insert('Modules', { id: 'm1', subjectId: 'sub1', name: 'Chương 1: Ôn tập và bổ sung', description: '', order: 1, isActive: true, createdAt: now, updatedAt: now });
  }

  // 5. Lessons
  if (db.findAll('Lessons').length === 0) {
    db.insert('Lessons', { id: 'l1', moduleId: 'm1', title: 'Bài 1: Đọc, viết, so sánh các số có ba chữ số', content: 'Nội dung bài học...', thumbnail: '', videoUrl: '', order: 1, status: 'PUBLISHED', createdAt: now, updatedAt: now });
  }

  // 6. Assignments
  if (db.findAll('Assignments').length === 0) {
    db.insert('Assignments', { id: 'a1', lessonId: 'l1', title: 'Bài tập về nhà 1', description: 'Làm bài tập trang 5 SGK', dueDate: '2023-12-31', attachmentUrl: '', maxStars: 10, optionsJson: '{}', createdAt: now, updatedAt: now });
  }
  
  // 7. Announcements
  if (db.findAll('Announcements').length === 0) {
    db.insert('Announcements', { id: 'ann1', classId: 'c1', target: 'ALL', title: 'Chào mừng năm học mới', content: 'Chúc các em học tốt!', authorId: 'u1', createdAt: now, updatedAt: now });
  }
}

function createAdminAccount() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const usersSheet = db.getSheet('Users');
  const data = usersSheet.getDataRange().getValues();
  const headers = data[0];
  const usernameIndex = headers.indexOf('username');
  let adminExists = false;
  for (let i = 1; i < data.length; i++) {
    if (data[i][usernameIndex] === 'admin') { adminExists = true; break; }
  }
  if (adminExists) {
    SpreadsheetApp.getUi().alert('Thông báo', 'Tài khoản admin đã tồn tại!', SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }
  const now = new Date().toISOString();
  const adminUser = ['user_admin_demo', 'admin', '123456', 'Quản trị viên Hệ thống', 'TEACHER', '', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin', '1980-01-01', '', now, now];
  usersSheet.appendRow(adminUser);
  SpreadsheetApp.getUi().alert('Thành công', 'Đã tạo tài khoản admin (Pass: 123456)', SpreadsheetApp.getUi().ButtonSet.OK);
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('LMS Admin')
    .addItem('1. Khởi tạo Database', 'setupDatabase')
    .addItem('2. Thêm dữ liệu mẫu', 'seedData')
    .addSeparator()
    .addItem('3. Tạo Admin Demo', 'createAdminAccount')
    .addToUi();
}
