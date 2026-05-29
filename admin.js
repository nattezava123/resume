let adminSessionId = localStorage.getItem('session_user_id');

document.addEventListener("DOMContentLoaded", () => {
    if (!adminSessionId) { window.location.href = 'login.html'; return; }
    document.getElementById('admin-id-badge').innerText = adminSessionId;
    switchAdminTab('profile'); 
});

function switchAdminTab(tabName) {
    document.querySelectorAll('.adm-tab-view').forEach(view => view.style.display = 'none');
    document.querySelectorAll('.sidebar .menu-item').forEach(item => item.classList.remove('active'));
    
    document.getElementById(`adm-${tabName}-view`).style.display = 'block';
    document.getElementById(`menu-${tabName}`).classList.add('active');
    
    if(tabName === 'profile') loadAdminProfile();
    if(tabName === 'users') renderEmployeeList();
    if(tabName === 'prices') loadFuelSettings();
    if(tabName === 'approves') renderApprovalQueue();
    if(tabName === 'reports') renderAllReports();
}

function loadAdminProfile() {
    const users = JSON.parse(localStorage.getItem('users'));
    const u = users.find(user => user.user_id === adminSessionId);
    if(u) {
        document.getElementById('adm-prefix').value = u.prefix || "นาย";
        document.getElementById('adm-firstname').value = u.firstname;
        document.getElementById('adm-lastname').value = u.lastname;
        document.getElementById('adm-userid').value = u.user_id;
        document.getElementById('adm-password').value = u.password;
        document.getElementById('adm-phone').value = u.phone_number;
    }
}

function updateAdminProfile() {
    let users = JSON.parse(localStorage.getItem('users'));
    const idx = users.findIndex(user => user.user_id === adminSessionId);
    if(idx !== -1) {
        users[idx].prefix = document.getElementById('adm-prefix').value;
        users[idx].firstname = document.getElementById('adm-firstname').value.trim();
        users[idx].lastname = document.getElementById('adm-lastname').value.trim();
        users[idx].password = document.getElementById('adm-password').value;
        users[idx].phone_number = document.getElementById('adm-phone').value.trim();
        localStorage.setItem('users', JSON.stringify(users));
        Swal.fire({ icon: 'success', title: 'อัปเดตสำเร็จ', text: 'บันทึกข้อมูลเรียบร้อย', confirmButtonColor: '#2563eb' });
    }
}

// ---------------------------------------------------------
// ฟังก์ชันจัดการพนักงาน (เพิ่ม/ลบ) - ตรงตามขอบเขตข้อ 1.3.1.2
// ---------------------------------------------------------
function renderEmployeeList() {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const tbody = document.getElementById('admin-user-tbody');
    tbody.innerHTML = '';
    users.forEach((u, idx) => {
        let deleteBtn = u.role === 'admin' ? '<span class="text-muted" style="font-size:12px;">แอดมิน</span>' : `<button class="btn-pill btn-red py-1 px-2" style="font-size:12px;" onclick="deleteUser('${u.user_id}')">ลบ</button>`;
        tbody.innerHTML += `
            <tr>
                <td>${idx + 1}</td>
                <td><strong>${u.user_id}</strong></td>
                <td>${u.prefix || ''}${u.firstname} ${u.lastname}</td>
                <td>${u.job_position}</td>
                <td>${u.phone_number}</td>
                <td>${deleteBtn}</td>
            </tr>`;
    });
}

function addNewUser() {
    Swal.fire({
        title: 'เพิ่มพนักงานใหม่',
        html: `
            <input id="swal-uid" class="swal2-input" placeholder="รหัสพนักงาน (Username)">
            <input id="swal-fname" class="swal2-input" placeholder="ชื่อ">
            <input id="swal-lname" class="swal2-input" placeholder="นามสกุล">
            <input id="swal-pass" class="swal2-input" placeholder="รหัสผ่าน" type="password">
        `,
        confirmButtonText: 'บันทึก',
        showCancelButton: true,
        cancelButtonText: 'ยกเลิก',
        preConfirm: () => {
            const uid = document.getElementById('swal-uid').value.trim();
            const fname = document.getElementById('swal-fname').value.trim();
            const pass = document.getElementById('swal-pass').value.trim();
            if(!uid || !fname || !pass) {
                Swal.showValidationMessage('กรุณากรอกรหัสพนักงาน, ชื่อ และรหัสผ่านให้ครบ');
            }
            return {
                user_id: uid, firstname: fname, lastname: document.getElementById('swal-lname').value,
                password: pass, role: 'user', prefix: 'นาย', job_position: 'พนักงานทั่วไป', phone_number: '-'
            }
        }
    }).then((result) => {
        if (result.isConfirmed) {
            let users = JSON.parse(localStorage.getItem('users'));
            if(users.find(u => u.user_id === result.value.user_id)) {
                Swal.fire('ข้อผิดพลาด', 'รหัสพนักงานนี้มีในระบบแล้ว!', 'error');
                return;
            }
            users.push(result.value);
            localStorage.setItem('users', JSON.stringify(users));
            renderEmployeeList();
            Swal.fire('สำเร็จ', 'เพิ่มพนักงานใหม่เรียบร้อย', 'success');
        }
    });
}

function deleteUser(uid) {
    Swal.fire({
        title: 'ลบพนักงาน?', text: `ต้องการลบรหัส ${uid} ใช่หรือไม่?`, icon: 'warning',
        showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'ลบทิ้ง'
    }).then((result) => {
        if (result.isConfirmed) {
            let users = JSON.parse(localStorage.getItem('users'));
            users = users.filter(u => u.user_id !== uid);
            localStorage.setItem('users', JSON.stringify(users));
            renderEmployeeList();
            Swal.fire('ลบสำเร็จ', '', 'success');
        }
    });
}

// ---------------------------------------------------------
// ฟังก์ชันออกรายงาน - ตรงตามขอบเขตข้อ 1.3.1.6
// ---------------------------------------------------------
function renderAllReports() {
    const reports = JSON.parse(localStorage.getItem('reports')) || [];
    const tbody = document.getElementById('admin-reports-tbody');
    tbody.innerHTML = '';
    
    // เรียงวันที่ล่าสุดขึ้นก่อน
    reports.slice().reverse().forEach(r => {
        let statusText = r.approve_disbursement === 'P' ? 'รออนุมัติ' : (r.approve_disbursement === 'Y' ? 'อนุมัติจ่ายแล้ว' : 'ไม่อนุมัติ');
        tbody.innerHTML += `
            <tr>
                <td>${r.work_date}</td>
                <td><strong>${r.user_id}</strong></td>
                <td>${r.work_detail}</td>
                <td>${r.fuel_type}</td>
                <td>${r.distance_km}</td>
                <td class="fw-bold">฿${r.reimbursable_expense}</td>
                <td><span class="status-tag status-${r.approve_disbursement}">${statusText}</span></td>
            </tr>
        `;
    });
}

// ---------------------------------------------------------
// ฟังก์ชันจัดการราคาน้ำมันและคิวอนุมัติ (โค้ดเดิม)
// ---------------------------------------------------------
function loadFuelSettings() {
    const fuels = JSON.parse(localStorage.getItem('fuels')) || [];
    const tbody = document.getElementById('fuel-price-tbody');
    tbody.innerHTML = '';
    fuels.forEach(f => {
        tbody.innerHTML += `<tr><td><span class="status-tag" style="background:#64748b; color:white; border:none;">${f.type}</span></td><td>${f.name}</td><td><input type="number" step="0.01" class="form-control fuel-rate-input text-center" data-id="${f.id}" value="${f.rate}" style="max-width:150px;"></td></tr>`;
    });
}

function updateFuelPrices() {
    let fuels = JSON.parse(localStorage.getItem('fuels'));
    document.querySelectorAll('.fuel-rate-input').forEach(input => {
        let id = parseInt(input.getAttribute('data-id'));
        let match = fuels.find(f => f.id === id);
        if(match) match.rate = parseFloat(input.value) || 0;
    });
    localStorage.setItem('fuels', JSON.stringify(fuels));
    Swal.fire({ icon: 'success', title: 'บันทึกสำเร็จ', text: 'อัปเดตเรทราคาสำเร็จ', confirmButtonColor: '#2563eb' });
}

function renderApprovalQueue() {
    const reports = JSON.parse(localStorage.getItem('reports')) || [];
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const container = document.getElementById('admin-verification-queue');
    container.innerHTML = '';
    const sortedReports = reports.slice().reverse().sort((a,b) => (a.approve_disbursement === 'P' ? -1 : 1));

    if (sortedReports.length === 0) { return; }
    
    sortedReports.forEach(r => {
        let u = users.find(x => x.user_id === r.user_id) || {};
        let fullName = `${u.prefix||''}${u.firstname||''} ${u.lastname||''}`;
        let actionButtons = '';
        if(r.approve_disbursement === 'P') {
            actionButtons = `<div class="mt-3"><button class="btn-pill btn-green me-2" onclick="processApproval('${r.report_id}', 'Y')">✔️ อนุมัติ</button><button class="btn-pill btn-red" onclick="processApproval('${r.report_id}', 'N')">❌ ไม่อนุมัติ</button></div>`;
        } else {
            let statusLabel = r.approve_disbursement === 'Y' ? 'อนุมัติแล้ว' : 'ปฏิเสธคำขอ';
            let reasonText = r.reason ? `<div class="text-danger mt-2" style="font-size:13px;">เหตุผล: ${r.reason}</div>` : '';
            actionButtons = `<div class="mt-3 fw-bold">สถานะ: <span class="status-tag status-${r.approve_disbursement}">${statusLabel}</span> ${reasonText}</div>`;
        }
        container.innerHTML += `<div class="white-card d-flex justify-content-between align-items-start gap-3"><div class="flex-grow-1"><div class="fw-bold fs-6 mb-2" style="color:#112246;">ผู้เบิก: ${fullName} (รหัส: ${r.user_id})</div><div><strong>วันที่:</strong> ${r.work_date} | <strong>งาน:</strong> ${r.work_detail}</div><div><strong>ประเภท:</strong> ${r.fuel_type} | <strong>ระยะทาง:</strong> ${r.distance_km} กม.</div><div class="fw-bold mt-2 text-success">ยอดเงินเบิก: ฿${r.reimbursable_expense}</div>${actionButtons}</div>${r.image_file ? `<img src="${r.image_file}" style="width:120px; height:120px; object-fit:cover; border-radius:8px; border:1px solid #ccc;">` : ''}</div>`;
    });
}

function processApproval(reportId, newStatus) {
    let reports = JSON.parse(localStorage.getItem('reports'));
    const idx = reports.findIndex(r => r.report_id === reportId);
    if(idx !== -1) {
        if(newStatus === 'N') {
            Swal.fire({ title: 'ปฏิเสธการเบิกจ่าย', text: 'เหตุผลที่ไม่อนุมัติ:', input: 'text', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'ยืนยัน', cancelButtonText: 'ยกเลิก' }).then((result) => {
                if (result.isConfirmed) {
                    reports[idx].reason = result.value || 'ไม่ได้ระบุเหตุผล';
                    reports[idx].approve_disbursement = newStatus;
                    localStorage.setItem('reports', JSON.stringify(reports));
                    renderApprovalQueue();
                    Swal.fire({ icon: 'success', title: 'บันทึกสำเร็จ', showConfirmButton: false, timer: 1500 });
                }
            });
        } else {
            Swal.fire({ title: 'ยืนยันการอนุมัติ?', icon: 'question', showCancelButton: true, confirmButtonColor: '#10b981', confirmButtonText: 'อนุมัติ', cancelButtonText: 'ยกเลิก' }).then((result) => {
                if(result.isConfirmed) {
                    reports[idx].approve_disbursement = newStatus;
                    localStorage.setItem('reports', JSON.stringify(reports));
                    renderApprovalQueue();
                    Swal.fire({ icon: 'success', title: 'อนุมัติเรียบร้อย', showConfirmButton: false, timer: 1500 });
                }
            });
        }
    }
}

function exitSystem() { 
    Swal.fire({ title: 'ออกจากระบบ', icon: 'question', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'ใช่, ออกจากระบบ' }).then((result) => {
        if(result.isConfirmed) { localStorage.removeItem('session_user_id'); window.location.href = 'login.html'; }
    });
}