// 家庭课外课程记录与管理系统 - 主应用程序
class CourseManager {
    constructor() {
        this.courses = [];
        this.students = [];
        this.courseTemplates = []; // 存储课程模板
        this.currentDate = new Date();
        this.currentView = 'calendar';
        this.editingCourse = null;
        
        this.init();
    }

    // 初始化应用程序
    init() {
        this.loadData();
        this.initializeDefaultData();
        this.clearOldStudentData(); // 强制更新学员数据
        this.bindEvents();
        this.renderCalendar();
        this.updateStudentSelects();
        this.updateCourseSelects();
        this.renderRecentRecords();
        this.renderStats();
        this.setCurrentDateAsDefault();
    }
    
    // 清除旧的学员数据缓存
    clearOldStudentData() {
        // 检查是否还有旧的学员数据
        if (this.students.some(s => s.name === '我' || s.name === '孩子A' || s.name === '孩子B')) {
            this.students = [
                { id: 1, name: '妈妈', color: 'student-me' },
                { id: 2, name: '壮壮', color: 'student-child1' }
            ];
            this.saveData();
        }
    }

    // 加载本地存储的数据
    loadData() {
        const savedCourses = localStorage.getItem('familyCourses');
        const savedStudents = localStorage.getItem('familyStudents');
        const savedCourseTemplates = localStorage.getItem('familyCourseTemplates');
        
        if (savedCourses) {
            this.courses = JSON.parse(savedCourses);
        }
        
        if (savedStudents) {
            this.students = JSON.parse(savedStudents);
        }
        
        if (savedCourseTemplates) {
            this.courseTemplates = JSON.parse(savedCourseTemplates);
        }
    }

    // 保存数据到本地存储
    saveData() {
        localStorage.setItem('familyCourses', JSON.stringify(this.courses));
        localStorage.setItem('familyStudents', JSON.stringify(this.students));
        localStorage.setItem('familyCourseTemplates', JSON.stringify(this.courseTemplates));
    }

    // 初始化默认数据
    initializeDefaultData() {
        if (this.students.length === 0) {
            this.students = [
                { id: 1, name: '妈妈', color: 'student-me' },
                { id: 2, name: '壮壮', color: 'student-child1' }
            ];
            this.saveData();
        }

        // 初始化课程模板
        if (this.courseTemplates.length === 0) {
            this.courseTemplates = [
                { id: 1, content: '钢琴课', totalHours: 20 },
                { id: 2, content: '英语课', totalHours: 24 }
            ];
            this.saveData();
        }

        // 清空初始化课程数据
        if (this.courses.length > 0) {
            this.courses = [];
            this.saveData();
        }
    }

    // 绑定事件监听器
    bindEvents() {
        // 导航按钮事件
        document.getElementById('calendarBtn').addEventListener('click', () => this.showView('calendar'));
        document.getElementById('addCourseBtn').addEventListener('click', () => this.showView('addCourse'));
        document.getElementById('courseManageBtn').addEventListener('click', () => this.showView('courseManage'));
        document.getElementById('statsBtn').addEventListener('click', () => this.showView('stats'));

        // 日历导航事件
        document.getElementById('prevMonth').addEventListener('click', () => this.changeMonth(-1));
        document.getElementById('nextMonth').addEventListener('click', () => this.changeMonth(1));

        // 表单事件
        document.getElementById('courseForm').addEventListener('submit', (e) => this.handleCourseSubmit(e));
        document.getElementById('editCourseForm').addEventListener('submit', (e) => this.handleEditCourseSubmit(e));
        document.getElementById('newCourseForm').addEventListener('submit', (e) => this.handleNewCourseSubmit(e));
        document.getElementById('cancelBtn').addEventListener('click', () => this.showView('calendar'));

        // 统计筛选事件
        document.getElementById('statsStudent').addEventListener('change', () => this.renderStats());
        document.getElementById('statsDateRange').addEventListener('change', () => this.renderStats());

        // 点击模态框外部关闭
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeAllModals();
            }
        });
    }

    // 设置当前日期为默认值
    setCurrentDateAsDefault() {
        const today = new Date();
        const dateInput = document.getElementById('courseDate');
        dateInput.value = this.formatDate(today);
    }

    // 显示指定视图
    showView(viewName) {
        // 更新导航按钮状态
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(viewName + 'Btn').classList.add('active');

        // 显示对应视图
        document.querySelectorAll('.view-section').forEach(section => section.classList.remove('active'));
        document.getElementById(viewName + 'View').classList.add('active');

        this.currentView = viewName;

        // 根据视图执行相应的渲染逻辑
        if (viewName === 'calendar') {
            this.renderCalendar();
        } else if (viewName === 'addCourse') {
            this.renderRecentRecords();
            this.clearForm();
        } else if (viewName === 'courseManage') {
            this.renderCoursesList();
        } else if (viewName === 'stats') {
            this.renderStats();
        }
    }

    // 渲染日历
    renderCalendar() {
        const calendarGrid = document.getElementById('calendarGrid');
        const currentMonth = document.getElementById('currentMonth');
        
        // 更新月份标题
        const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', 
                           '7月', '8月', '9月', '10月', '11月', '12月'];
        currentMonth.textContent = `${this.currentDate.getFullYear()}年 ${monthNames[this.currentDate.getMonth()]}`;

        // 清空日历网格
        calendarGrid.innerHTML = '';

        // 添加星期标题
        const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
        weekDays.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-header-day';
            dayHeader.textContent = day;
            calendarGrid.appendChild(dayHeader);
        });

        // 获取当月第一天和最后一天
        const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
        const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        // 生成日历天数
        const today = new Date();
        for (let i = 0; i < 42; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);

            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            
            // 添加日期类别类名
            if (date.getMonth() !== this.currentDate.getMonth()) {
                dayElement.classList.add('other-month');
            }
            
            if (this.isSameDate(date, today)) {
                dayElement.classList.add('today');
            }

            // 检查当天是否有课程
            const dayKey = this.formatDate(date);
            const dayCoursesData = this.getCoursesForDate(dayKey);
            
            if (dayCoursesData.length > 0) {
                dayElement.classList.add('has-courses');
            }

            // 创建日期内容
            const dayNumber = document.createElement('div');
            dayNumber.className = 'day-number';
            dayNumber.textContent = date.getDate();
            dayElement.appendChild(dayNumber);

            // 添加课程指示器
            if (dayCoursesData.length > 0) {
                const indicators = document.createElement('div');
                indicators.className = 'day-indicators';
                
                const studentSet = new Set();
                dayCoursesData.forEach(course => {
                    if (!studentSet.has(course.student)) {
                        studentSet.add(course.student);
                        const student = this.students.find(s => s.name === course.student);
                        if (student) {
                            const indicator = document.createElement('span');
                            indicator.className = `course-indicator ${student.color}`;
                            indicators.appendChild(indicator);
                        }
                    }
                });
                
                dayElement.appendChild(indicators);
            }

            // 点击事件
            dayElement.addEventListener('click', () => this.showDayDetails(date));

            calendarGrid.appendChild(dayElement);
        }
    }

    // 更改月份
    changeMonth(delta) {
        this.currentDate.setMonth(this.currentDate.getMonth() + delta);
        this.renderCalendar();
    }

    // 显示某日的详细信息
    showDayDetails(date) {
        const dayKey = this.formatDate(date);
        const dayCoursesData = this.getCoursesForDate(dayKey);
        
        const modal = document.getElementById('dayDetailsModal');
        const modalDate = document.getElementById('modalDate');
        const dayDetailsList = document.getElementById('dayDetailsList');

        modalDate.textContent = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 课程详情`;

        if (dayCoursesData.length === 0) {
            dayDetailsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-times"></i>
                    <h3>没有课程安排</h3>
                    <p>这一天还没有安排任何课程</p>
                </div>
            `;
        } else {
            dayDetailsList.innerHTML = '';
            dayCoursesData.forEach(course => {
                const courseElement = document.createElement('div');
                courseElement.className = 'day-detail-item';
                courseElement.innerHTML = `
                    <div class="record-header">
                        <div class="record-course">${course.courseName}</div>
                        <div class="record-student">${course.student}</div>
                    </div>
                    <div class="record-notes">${course.notes || '暂无备注'}</div>
                `;
                courseElement.addEventListener('click', () => {
                    this.closeDayDetails();
                    this.editCourse(course);
                });
                dayDetailsList.appendChild(courseElement);
            });
        }

        modal.classList.add('show');
    }

    // 关闭日期详情弹窗
    closeDayDetails() {
        const modal = document.getElementById('dayDetailsModal');
        modal.classList.remove('show');
    }

    // 获取指定日期的课程
    getCoursesForDate(date) {
        return this.courses.filter(course => course.date === date);
    }

    // 处理课程表单提交
    handleCourseSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const courseData = {
            id: Date.now(),
            date: formData.get('date'),
            student: formData.get('student'),
            courseName: formData.get('courseName'),
            notes: formData.get('notes'),
            timestamp: new Date().getTime()
        };

        this.courses.unshift(courseData);
        this.saveData();
        
        this.showSuccessMessage('课程记录已成功添加！');
        this.clearForm();
        this.renderRecentRecords();
        this.renderCalendar();
    }

    // 处理编辑课程表单提交
    handleEditCourseSubmit(e) {
        e.preventDefault();
        
        if (!this.editingCourse) return;

        const formData = new FormData(e.target);
        const courseIndex = this.courses.findIndex(c => c.id === this.editingCourse.id);
        
        if (courseIndex !== -1) {
            this.courses[courseIndex] = {
                ...this.courses[courseIndex],
                date: formData.get('date'),
                student: formData.get('student'),
                courseName: formData.get('courseName'),
                notes: formData.get('notes')
            };
            
            this.saveData();
            this.showSuccessMessage('课程记录已成功更新！');
            this.closeEditModal();
            this.renderCalendar();
            this.renderRecentRecords();
        }
    }

    // 编辑课程
    editCourse(course) {
        this.editingCourse = course;
        
        // 填充编辑表单
        document.getElementById('editCourseDate').value = course.date;
        document.getElementById('editCourseStudent').value = course.student;
        document.getElementById('editCourseName').value = course.courseName;
        document.getElementById('editCourseNotes').value = course.notes || '';
        
        // 更新编辑表单的学员选项
        this.updateEditStudentSelect();
        
        // 显示编辑模态框
        document.getElementById('editCourseModal').classList.add('show');
    }

    // 删除课程
    deleteCourse() {
        if (!this.editingCourse) return;
        
        if (confirm('确定要删除这条课程记录吗？此操作不可恢复。')) {
            this.courses = this.courses.filter(c => c.id !== this.editingCourse.id);
            this.saveData();
            this.showSuccessMessage('课程记录已成功删除！');
            this.closeEditModal();
            this.renderCalendar();
            this.renderRecentRecords();
            this.renderStats();
        }
    }

    // 关闭编辑模态框
    closeEditModal() {
        document.getElementById('editCourseModal').classList.remove('show');
        this.editingCourse = null;
    }

    // 清空表单
    clearForm() {
        document.getElementById('courseForm').reset();
        this.setCurrentDateAsDefault();
    }

    // 更新学员选择框
    updateStudentSelects() {
        const selects = ['courseStudent', 'editCourseStudent', 'statsStudent'];
        
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (!select) return;
            
            // 保存当前选中的值
            const currentValue = select.value;
            
            // 清空选项
            if (selectId === 'statsStudent') {
                select.innerHTML = '<option value="">全部学员</option>';
            } else {
                select.innerHTML = '<option value="">请选择学员</option>';
            }
            
            // 添加学员选项
            this.students.forEach(student => {
                const option = document.createElement('option');
                option.value = student.name;
                option.textContent = student.name;
                select.appendChild(option);
            });
            
            // 恢复选中的值
            if (currentValue) {
                select.value = currentValue;
            }
        });
    }

    // 更新编辑表单的学员选择框
    updateEditStudentSelect() {
        const select = document.getElementById('editCourseStudent');
        select.innerHTML = '<option value="">请选择学员</option>';
        
        this.students.forEach(student => {
            const option = document.createElement('option');
            option.value = student.name;
            option.textContent = student.name;
            select.appendChild(option);
        });
    }

    // 渲染最近记录
    renderRecentRecords() {
        const container = document.getElementById('recentRecords');
        const recentCourses = this.courses
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 5);

        if (recentCourses.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-book-open"></i>
                    <h3>暂无课程记录</h3>
                    <p>开始添加您的第一条课程记录吧！</p>
                </div>
            `;
            return;
        }

        container.innerHTML = '';
        recentCourses.forEach(course => {
            const recordElement = document.createElement('div');
            recordElement.className = 'record-item';
            recordElement.innerHTML = `
                <div class="record-header">
                    <div class="record-date">${course.date}</div>
                    <div class="record-student">${course.student}</div>
                </div>
                <div class="record-course">${course.courseName}</div>
                <div class="record-notes">${course.notes || '暂无备注'}</div>
                <div class="record-actions">
                    <button class="action-btn edit-btn" onclick="app.editCourse({id: ${course.id}})">
                        <i class="fas fa-edit"></i> 编辑
                    </button>
                    <button class="action-btn delete-btn" onclick="app.deleteCourse(${course.id})">
                        <i class="fas fa-trash"></i> 删除
                    </button>
                </div>
            `;
            
            container.appendChild(recordElement);
        });
    }

    // 渲染统计信息
    renderStats() {
        const selectedStudent = document.getElementById('statsStudent').value;
        const selectedRange = document.getElementById('statsDateRange').value;
        
        let filteredCourses = this.courses;

        // 按学员筛选
        if (selectedStudent) {
            filteredCourses = filteredCourses.filter(course => course.student === selectedStudent);
        }

        // 按时间范围筛选
        const now = new Date();
        if (selectedRange === 'thisMonth') {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            filteredCourses = filteredCourses.filter(course => {
                const courseDate = new Date(course.date);
                return courseDate >= startOfMonth && courseDate <= now;
            });
        } else if (selectedRange === 'lastMonth') {
            const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
            filteredCourses = filteredCourses.filter(course => {
                const courseDate = new Date(course.date);
                return courseDate >= startOfLastMonth && courseDate <= endOfLastMonth;
            });
        } else if (selectedRange === 'thisYear') {
            const startOfYear = new Date(now.getFullYear(), 0, 1);
            filteredCourses = filteredCourses.filter(course => {
                const courseDate = new Date(course.date);
                return courseDate >= startOfYear && courseDate <= now;
            });
        }

        // 更新统计卡片
        document.getElementById('totalCourses').textContent = filteredCourses.length;
        
        const activeStudents = new Set(filteredCourses.map(course => course.student));
        document.getElementById('activeStudents').textContent = activeStudents.size;
        
        const courseTypes = new Set(filteredCourses.map(course => course.courseName));
        document.getElementById('courseTypes').textContent = courseTypes.size;

        // 生成详细统计表格
        this.renderStatsTable(filteredCourses);
    }

    // 渲染统计表格
    renderStatsTable(courses) {
        const tableContainer = document.getElementById('statsTable');
        
        if (courses.length === 0) {
            tableContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-chart-bar"></i>
                    <h3>暂无统计数据</h3>
                    <p>在选定的条件下没有找到课程记录</p>
                </div>
            `;
            return;
        }

        // 按学员和课程统计
        const stats = {};
        courses.forEach(course => {
            if (!stats[course.student]) {
                stats[course.student] = {};
            }
            if (!stats[course.student][course.courseName]) {
                stats[course.student][course.courseName] = 0;
            }
            stats[course.student][course.courseName]++;
        });

        // 生成表格HTML
        let tableHTML = `
            <table class="stats-table">
                <thead>
                    <tr>
                        <th>学员</th>
                        <th>课程名称</th>
                        <th>总课时</th>
                        <th>已上课时</th>
                        <th>剩余课时</th>
                        <th>最近上课</th>
                    </tr>
                </thead>
                <tbody>
        `;

        Object.entries(stats).forEach(([student, courseStats]) => {
            Object.entries(courseStats).forEach(([courseName, count]) => {
                const latestCourse = courses
                    .filter(c => c.student === student && c.courseName === courseName)
                    .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
                
                // 查找课程模板获取总课时
                const template = this.courseTemplates.find(ct => ct.content === courseName);
                const totalHours = template ? template.totalHours : 0;
                const remainingHours = Math.max(0, totalHours - count);
                
                tableHTML += `
                    <tr>
                        <td>${student}</td>
                        <td>${courseName}</td>
                        <td>${totalHours}小时</td>
                        <td>${count}小时</td>
                        <td>${remainingHours}小时</td>
                        <td>${latestCourse.date}</td>
                    </tr>
                `;
            });
        });

        tableHTML += `
                </tbody>
            </table>
        `;

        tableContainer.innerHTML = tableHTML;
    }

    // 学员管理相关方法
    addStudent() {
        const nameInput = document.getElementById('newStudentName');
        const name = nameInput.value.trim();
        
        if (!name) {
            alert('请输入学员姓名');
            return;
        }
        
        if (this.students.find(s => s.name === name)) {
            alert('该学员已存在');
            return;
        }
        
        const colors = ['student-me', 'student-child1', 'student-child2', 'student-child3'];
        const newStudent = {
            id: Date.now(),
            name: name,
            color: colors[this.students.length % colors.length]
        };
        
        this.students.push(newStudent);
        this.saveData();
        this.updateStudentSelects();
        this.renderStudentList();
        
        nameInput.value = '';
        this.showSuccessMessage(`学员 ${name} 添加成功！`);
    }

    // 删除学员
    removeStudent(studentId) {
        const student = this.students.find(s => s.id === studentId);
        if (!student) return;
        
        // 检查该学员是否有课程记录
        const hasRecords = this.courses.some(course => course.student === student.name);
        if (hasRecords) {
            if (!confirm(`学员 ${student.name} 有相关的课程记录，删除学员将会保留这些记录。确定继续吗？`)) {
                return;
            }
        }
        
        this.students = this.students.filter(s => s.id !== studentId);
        this.saveData();
        this.updateStudentSelects();
        this.renderStudentList();
        
        this.showSuccessMessage(`学员 ${student.name} 已删除！`);
    }

    // 渲染学员列表
    renderStudentList() {
        const container = document.getElementById('studentList');
        container.innerHTML = '';
        
        this.students.forEach(student => {
            const studentElement = document.createElement('div');
            studentElement.className = 'student-item';
            studentElement.innerHTML = `
                <span class="student-name">${student.name}</span>
                <button onclick="app.removeStudent(${student.id})" class="remove-student-btn">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            container.appendChild(studentElement);
        });
    }

    // 课程模板管理相关方法
    handleNewCourseSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const courseTemplate = {
            id: Date.now(),
            content: formData.get('courseContent'),
            totalHours: parseInt(formData.get('totalHours')),
            createdAt: new Date().getTime()
        };
        
        // 检查是否已存在相同课程内容
        if (this.courseTemplates.some(ct => ct.content === courseTemplate.content)) {
            this.showErrorMessage('该课程内容已存在！');
            return;
        }
        
        this.courseTemplates.push(courseTemplate);
        this.saveData();
        
        this.showSuccessMessage('课程模板添加成功！');
        document.getElementById('newCourseForm').reset();
        this.renderCoursesList();
        this.updateCourseSelects();
    }
    
    renderCoursesList() {
        const container = document.getElementById('coursesList');
        
        if (this.courseTemplates.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-graduation-cap"></i>
                    <h3>暂无课程模板</h3>
                    <p>添加您的第一个课程模板吧！</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = '';
        this.courseTemplates.forEach(template => {
            const courseElement = document.createElement('div');
            courseElement.className = 'course-item';
            courseElement.innerHTML = `
                <div class="course-content">
                    <h4>${template.content}</h4>
                    <p>总课时：${template.totalHours}小时</p>
                </div>
                <div class="course-actions">
                    <button class="action-btn edit-btn" onclick="app.editCourseTemplate(${template.id})">
                        <i class="fas fa-edit"></i> 编辑
                    </button>
                    <button class="action-btn delete-btn" onclick="app.deleteCourseTemplate(${template.id})">
                        <i class="fas fa-trash"></i> 删除
                    </button>
                </div>
            `;
            container.appendChild(courseElement);
        });
    }
    
    updateCourseSelects() {
        const courseSelects = document.querySelectorAll('#courseName');
        courseSelects.forEach(select => {
            const currentValue = select.value;
            select.innerHTML = '<option value="">请选择课程</option>';
            
            this.courseTemplates.forEach(template => {
                const option = document.createElement('option');
                option.value = template.content;
                option.textContent = `${template.content} (${template.totalHours}小时)`;
                select.appendChild(option);
            });
            
            if (currentValue) {
                select.value = currentValue;
            }
        });
    }
    
    editCourseTemplate(id) {
        const template = this.courseTemplates.find(ct => ct.id === id);
        if (!template) return;
        
        const content = prompt('请输入课程内容：', template.content);
        if (!content || content.trim() === '') return;
        
        const totalHours = prompt('请输入总课时：', template.totalHours);
        if (!totalHours || isNaN(totalHours) || totalHours <= 0) {
            this.showErrorMessage('请输入有效的课时数！');
            return;
        }
        
        // 检查是否与其他课程重名
        if (content !== template.content && this.courseTemplates.some(ct => ct.content === content)) {
            this.showErrorMessage('该课程内容已存在！');
            return;
        }
        
        template.content = content.trim();
        template.totalHours = parseInt(totalHours);
        
        this.saveData();
        this.showSuccessMessage('课程模板更新成功！');
        this.renderCoursesList();
        this.updateCourseSelects();
    }
    
    deleteCourseTemplate(id) {
        const template = this.courseTemplates.find(ct => ct.id === id);
        if (!template) return;
        
        if (confirm(`确定要删除课程模板"${template.content}"吗？`)) {
            this.courseTemplates = this.courseTemplates.filter(ct => ct.id !== id);
            this.saveData();
            this.showSuccessMessage('课程模板删除成功！');
            this.renderCoursesList();
            this.updateCourseSelects();
        }
    }

    // 删除课程记录
    deleteCourse(id) {
        const course = this.courses.find(c => c.id === id);
        if (!course) return;
        
        if (confirm(`确定要删除"${course.courseName}"课程记录吗？`)) {
            this.courses = this.courses.filter(c => c.id !== id);
            this.saveData();
            this.showSuccessMessage('课程记录删除成功！');
            this.renderRecentRecords();
            this.renderCalendar();
        }
    }

    // 数据管理相关方法
    exportData() {
        const data = {
            courses: this.courses,
            students: this.students,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `课程数据_${this.formatDate(new Date())}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        this.showSuccessMessage('数据导出成功！');
    }

    // 导入数据
    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    if (data.courses && data.students) {
                        if (confirm('导入数据将覆盖现有数据，确定继续吗？')) {
                            this.courses = data.courses;
                            this.students = data.students;
                            this.saveData();
                            this.init(); // 重新初始化界面
                            this.showSuccessMessage('数据导入成功！');
                        }
                    } else {
                        alert('文件格式不正确');
                    }
                } catch (error) {
                    alert('文件解析失败：' + error.message);
                }
            };
            reader.readAsText(file);
        };
        
        input.click();
    }

    // 重置数据
    resetData() {
        if (confirm('确定要清空所有数据吗？此操作不可恢复！')) {
            if (confirm('请再次确认：这将删除所有课程记录和学员信息！')) {
                localStorage.removeItem('familyCourses');
                localStorage.removeItem('familyStudents');
                this.courses = [];
                this.students = [];
                this.initializeDefaultData();
                this.init(); // 重新初始化界面
                this.showSuccessMessage('所有数据已清空，已恢复默认设置！');
            }
        }
    }

    // 设置相关方法
    openSettingsModal() {
        this.renderStudentList();
        document.getElementById('settingsModal').classList.add('show');
    }

    closeSettingsModal() {
        document.getElementById('settingsModal').classList.remove('show');
    }

    // 关闭所有模态框
    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('show');
        });
        this.editingCourse = null;
    }

    // 工具方法
    formatDate(date) {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const day = d.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    isSameDate(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }

    showSuccessMessage(message) {
        // 创建成功消息元素
        const messageDiv = document.createElement('div');
        messageDiv.className = 'success-message';
        messageDiv.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        `;
        
        // 插入到页面顶部
        document.querySelector('.main-content').insertBefore(messageDiv, document.querySelector('.main-content').firstChild);
        
        // 3秒后自动移除
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 3000);
    }
}

// 全局函数（用于HTML中的事件处理）
function closeDayDetails() {
    app.closeDayDetails();
}

function closeEditModal() {
    app.closeEditModal();
}

function deleteCourse() {
    app.deleteCourse();
}

function closeSettingsModal() {
    app.closeSettingsModal();
}

function openSettingsModal() {
    app.openSettingsModal();
}

function addStudent() {
    app.addStudent();
}

function exportData() {
    app.exportData();
}

function importData() {
    app.importData();
}

function resetData() {
    app.resetData();
}

// 初始化应用程序
let app;
document.addEventListener('DOMContentLoaded', function() {
    app = new CourseManager();
    
    // 添加键盘快捷键
    document.addEventListener('keydown', function(e) {
        // ESC键关闭模态框
        if (e.key === 'Escape') {
            app.closeAllModals();
        }
        
        // Ctrl+N 或 Cmd+N 添加新课程
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            app.showView('addCourse');
        }
        
        // Ctrl+S 或 Cmd+S 保存（如果在表单中）
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            const activeElement = document.activeElement;
            if (activeElement && (activeElement.form || activeElement.tagName === 'FORM')) {
                e.preventDefault();
                activeElement.form?.querySelector('button[type="submit"]')?.click();
            }
        }
    });

    // 添加新学员输入框回车事件
    document.getElementById('newStudentName').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            app.addStudent();
        }
    });

    // 响应式设计：检测屏幕尺寸并调整布局
    function checkScreenSize() {
        const isMobile = window.innerWidth <= 768;
        document.body.classList.toggle('mobile', isMobile);
    }

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    // 添加服务工作者（如果浏览器支持）
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(function(error) {
            console.log('Service Worker registration failed:', error);
        });
    }

    // 防止意外刷新丢失未保存的数据
    window.addEventListener('beforeunload', function(e) {
        const forms = document.querySelectorAll('form');
        let hasUnsavedData = false;
        
        forms.forEach(form => {
            const inputs = form.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                if (input.value && input.value.trim() !== '') {
                    hasUnsavedData = true;
                }
            });
        });
        
        if (hasUnsavedData && app.currentView === 'addCourse') {
            e.preventDefault();
            e.returnValue = '您可能有未保存的数据，确定要离开吗？';
        }
    });
});