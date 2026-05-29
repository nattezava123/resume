let adminSessionId = localStorage.getItem('session_user_id');

document.addEventListener("DOMContentLoaded", () => {
    if (!adminSessionId) { window.location.href = 'login.html'; return; }
    updateHeaderDisplay();
    switchAdminTab('profile'); 
});

function updateHeaderDisplay() {
    const users = JSON.parse(localStorage.getItem('users'));
    const u = users.find(user => user.user_id === adminSessionId);
    if(u) {
        document.getElementById('header-user-name').innerText = `${u.firstname} ${u.lastname}`;
        document.getElementById('header-avatar').src = u.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150";
    }
}

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
        document.getElementById('adm-avatar-display').src = u.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150";
    }
}

function updateAdminProfile() {
    let users = JSON.parse(localStorage.getItem('users'));
    const idx = users.findIndex(user => user.user_id === adminSessionId);
    if(idx !== -1) {
        const executeUpdate = (base64Img) => {
            users[idx].prefix = document.getElementById('adm-prefix').value;
            users[idx].firstname = document.getElementById('adm-firstname').value.trim();
            users[idx].lastname = document.getElementById('adm-lastname').value.trim();
            users[idx].password = document.getElementById('adm-password').value;
            users[idx].phone_number = document.getElementById('adm-phone').value.trim();
            if(base64Img) users[idx].avatar = base64Img; // อัปเดตเฉพาะเมื่อมีการอัปโหลดรูปใหม่
            
            localStorage.setItem('users', JSON.stringify(users));
            document.getElementById('adm-avatar-display').src = users[idx].avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150";
            document.getElementById('adm-avatar').value = ''; // เคลียร์ช่องไฟล์
            updateHeaderDisplay();
            Swal.fire({ icon: 'success', title: 'อัปเดตสำเร็จ', text: 'บันทึกข้อมูลเรียบร้อย', confirmButtonColor: '#2563eb' });
        };

        const fileInput = document.getElementById('adm-avatar');
        if (fileInput.files.length > 0) {
            const reader = new FileReader();
            reader.onload = function(e) { executeUpdate(e.target.result); };
            reader.readAsDataURL(fileInput.files[0]);
        } else {
            executeUpdate(null);
        }
    }
}

function renderEmployeeList() {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const tbody = document.getElementById('admin-user-tbody');
    tbody.innerHTML = '';
    
    users.forEach((u, idx) => {
        let actionBtns = u.user_id === adminSessionId ? '<span class="text-muted" style="font-size:12px;">(บัญชีของคุณ)</span>' : `<button class="btn-pill btn-edit py-1 px-2 me-1" style="font-size:12px;" onclick="editUser('${u.user_id}')">✏️ แก้ไข</button> <button class="btn-pill btn-red py-1 px-2" style="font-size:12px;" onclick="deleteUser('${u.user_id}')">🗑️ ลบ</button>`;
        let roleBadge = u.role === 'admin' ? '<span class="badge bg-primary">Admin</span>' : '<span class="badge bg-secondary">User</span>';
        let avatarImg = u.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150";
        
        // แก้ไขให้ใช้คลาส avatar-sm
        tbody.innerHTML += `<tr><td>${idx + 1}</td><td><img src="${avatarImg}" class="avatar-sm"></td><td><strong>${u.user_id}</strong> <br>${roleBadge}</td><td>${u.prefix || ''}${u.firstname} ${u.lastname}</td><td>${u.job_position || 'พนักงาน'}</td><td>${u.phone_number || '-'}</td><td>${actionBtns}</td></tr>`;
    });
}
function addNewUser() {
    Swal.fire({
        title: 'เพิ่มพนักงานใหม่',
        html: `
            <input id="swal-uid" class="swal2-input" placeholder="รหัสพนักงาน (Username)" style="width: 80%;">
            <input id="swal-pass" class="swal2-input" placeholder="รหัสผ่าน (Password)" type="text" style="width: 80%;">
            <input id="swal-fname" class="swal2-input" placeholder="ชื่อจริง" style="width: 80%;">
            <input id="swal-lname" class="swal2-input" placeholder="นามสกุล" style="width: 80%;">
            <input id="swal-position" class="swal2-input" placeholder="ตำแหน่งงาน" style="width: 80%;">
            <input id="swal-phone" class="swal2-input" placeholder="เบอร์โทรศัพท์" style="width: 80%;">
            <div style="text-align: left; font-size: 14px; margin-top: 15px; margin-bottom: 5px; padding-left: 10%;">อัปโหลดรูปโปรไฟล์ (ไม่บังคับ)</div>
            <input id="swal-avatar" class="form-control" type="file" accept="image/*" style="width: 80%; margin: 0 auto;">
            <select id="swal-role" class="swal2-input" style="width: 80%;">
                <option value="user">สิทธิ์: พนักงานทั่วไป (User)</option><option value="admin">สิทธิ์: ผู้ดูแลระบบ (Admin)</option>
            </select>
        `,
        confirmButtonText: 'บันทึกข้อมูล', showCancelButton: true, cancelButtonText: 'ยกเลิก', confirmButtonColor: '#2563eb',
        preConfirm: () => {
            const uid = document.getElementById('swal-uid').value.trim();
            const pass = document.getElementById('swal-pass').value.trim();
            const fname = document.getElementById('swal-fname').value.trim();
            if(!uid || !pass || !fname) { Swal.showValidationMessage('กรุณากรอก รหัสพนักงาน, รหัสผ่าน และชื่อ ให้ครบถ้วน'); }
            
            return {
                user_id: uid, password: pass, firstname: fname, 
                lastname: document.getElementById('swal-lname').value.trim(),
                job_position: document.getElementById('swal-position').value.trim() || 'พนักงานทั่วไป', 
                phone_number: document.getElementById('swal-phone').value.trim() || '-',
                avatarFile: document.getElementById('swal-avatar').files[0], // ดึงออบเจ็กต์ไฟล์มา
                role: document.getElementById('swal-role').value,
                prefix: 'นาย', work_location: 'สำนักงานใหญ่', department: 'ทั่วไป'
            }
        }
    }).then((result) => {
        if (result.isConfirmed) {
            let data = result.value;
            let users = JSON.parse(localStorage.getItem('users'));
            if(users.find(u => u.user_id === data.user_id)) { Swal.fire('ข้อผิดพลาด', 'รหัสพนักงานนี้มีอยู่ในระบบแล้ว!', 'error'); return; }
            
            const finishSave = (base64) => {
                data.avatar = base64 || "";
                delete data.avatarFile; // ลบ Object ไฟล์ทิ้งก่อนบันทึกลง localStorage
                users.push(data);
                localStorage.setItem('users', JSON.stringify(users));
                renderEmployeeList();
                Swal.fire('สำเร็จ', 'เพิ่มพนักงานใหม่เรียบร้อย', 'success');
            };

            if(data.avatarFile) {
                const reader = new FileReader();
                reader.onload = e => finishSave(e.target.result);
                reader.readAsDataURL(data.avatarFile);
            } else { finishSave(""); }
        }
    });
}

function editUser(uid) {
    let users = JSON.parse(localStorage.getItem('users'));
    let u = users.find(x => x.user_id === uid);
    if(!u) return;

    Swal.fire({
        title: `แก้ไขข้อมูล: ${uid}`,
        html: `
            <div style="text-align: left; font-size: 14px; margin-bottom: 5px; padding-left: 10%;">รหัสผ่านใหม่ (เว้นว่างไว้หากไม่เปลี่ยน)</div>
            <input id="swal-edit-pass" class="swal2-input" placeholder="รหัสผ่านใหม่" type="text" style="width: 80%;">
            <div style="text-align: left; font-size: 14px; margin-top: 15px; margin-bottom: 5px; padding-left: 10%;">ชื่อ - นามสกุล</div>
            <input id="swal-edit-fname" class="swal2-input" placeholder="ชื่อจริง" value="${u.firstname}" style="width: 80%;">
            <input id="swal-edit-lname" class="swal2-input" placeholder="นามสกุล" value="${u.lastname}" style="width: 80%;">
            <div style="text-align: left; font-size: 14px; margin-top: 15px; margin-bottom: 5px; padding-left: 10%;">ตำแหน่งงาน และ เบอร์โทรศัพท์</div>
            <input id="swal-edit-position" class="swal2-input" placeholder="ตำแหน่งงาน" value="${u.job_position || ''}" style="width: 80%;">
            <input id="swal-edit-phone" class="swal2-input" placeholder="เบอร์โทรศัพท์" value="${u.phone_number || ''}" style="width: 80%;">
            <div style="text-align: left; font-size: 14px; margin-top: 15px; margin-bottom: 5px; padding-left: 10%;">อัปโหลดรูปโปรไฟล์ใหม่</div>
            <input id="swal-edit-avatar" class="form-control" type="file" accept="image/*" style="width: 80%; margin: 0 auto;">
            <div style="text-align: left; font-size: 14px; margin-top: 15px; margin-bottom: 5px; padding-left: 10%;">สิทธิ์การใช้งาน</div>
            <select id="swal-edit-role" class="swal2-input" style="width: 80%;">
                <option value="user" ${u.role === 'user' ? 'selected' : ''}>พนักงานทั่วไป (User)</option>
                <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>ผู้ดูแลระบบ (Admin)</option>
            </select>
        `,
        confirmButtonText: 'บันทึกการแก้ไข', showCancelButton: true, cancelButtonText: 'ยกเลิก', confirmButtonColor: '#f59e0b',
        preConfirm: () => {
            const fname = document.getElementById('swal-edit-fname').value.trim();
            if(!fname) { Swal.showValidationMessage('ชื่อจริงไม่สามารถเว้นว่างได้'); }
            return {
                password: document.getElementById('swal-edit-pass').value.trim(), firstname: fname, lastname: document.getElementById('swal-edit-lname').value.trim(),
                job_position: document.getElementById('swal-edit-position').value.trim(), phone_number: document.getElementById('swal-edit-phone').value.trim(),
                avatarFile: document.getElementById('swal-edit-avatar').files[0], role: document.getElementById('swal-edit-role').value
            }
        }
    }).then((result) => {
        if (result.isConfirmed) {
            let data = result.value;
            
            const finishSave = (base64) => {
                if (data.password !== '') { u.password = data.password; }
                u.firstname = data.firstname; u.lastname = data.lastname; u.job_position = data.job_position || 'พนักงานทั่วไป'; u.phone_number = data.phone_number || '-'; u.role = data.role;
                if(base64) { u.avatar = base64; } // อัปเดตเฉพาะถ้ามีการเลือกรูปใหม่

                localStorage.setItem('users', JSON.stringify(users));
                renderEmployeeList();
                Swal.fire({icon: 'success', title: 'บันทึกสำเร็จ', showConfirmButton: false, timer: 1500});
            };

            if(data.avatarFile) {
                const reader = new FileReader();
                reader.onload = e => finishSave(e.target.result);
                reader.readAsDataURL(data.avatarFile);
            } else { finishSave(null); }
        }
    });
}

function deleteUser(uid) {
    Swal.fire({ title: 'ยืนยันการลบพนักงาน?', text: `คุณกำลังจะลบรหัส ${uid} ออกจากระบบ`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'ใช่, ลบทิ้งเลย', cancelButtonText: 'ยกเลิก' }).then((result) => {
        if (result.isConfirmed) { let users = JSON.parse(localStorage.getItem('users')); users = users.filter(u => u.user_id !== uid); localStorage.setItem('users', JSON.stringify(users)); renderEmployeeList(); Swal.fire({icon: 'success', title: 'ลบสำเร็จ', showConfirmButton: false, timer: 1500}); }
    });
}

function renderAllReports() {
    const reports = JSON.parse(localStorage.getItem('reports')) || []; const tbody = document.getElementById('admin-reports-tbody'); tbody.innerHTML = '';
    if (reports.length === 0) { tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">📥 ยังไม่มีข้อมูลรายงาน</td></tr>'; return; }
    reports.slice().reverse().forEach(r => {
        let statusText = r.approve_disbursement === 'P' ? 'รออนุมัติ' : (r.approve_disbursement === 'Y' ? 'อนุมัติจ่ายแล้ว' : 'ไม่อนุมัติ');
        tbody.innerHTML += `<tr><td>${r.work_date}</td><td><strong>${r.user_id}</strong></td><td>${r.work_detail}</td><td>${r.fuel_type}</td><td>${r.distance_km}</td><td class="fw-bold text-success">฿${r.reimbursable_expense}</td><td><span class="status-tag status-${r.approve_disbursement}">${statusText}</span></td></tr>`;
    });
}

function loadFuelSettings() {
    const fuels = JSON.parse(localStorage.getItem('fuels')) || []; const tbody = document.getElementById('fuel-price-tbody'); tbody.innerHTML = '';
    fuels.forEach(f => { tbody.innerHTML += `<tr><td><span class="status-tag" style="background:#64748b; color:white; border:none;">${f.type}</span></td><td>${f.name}</td><td><input type="number" step="0.01" class="form-control fuel-rate-input text-center" data-id="${f.id}" value="${f.rate}" style="max-width:150px;"></td></tr>`; });
}

function updateFuelPrices() {
    let fuels = JSON.parse(localStorage.getItem('fuels')); document.querySelectorAll('.fuel-rate-input').forEach(input => { let id = parseInt(input.getAttribute('data-id')); let match = fuels.find(f => f.id === id); if(match) match.rate = parseFloat(input.value) || 0; });
    localStorage.setItem('fuels', JSON.stringify(fuels)); Swal.fire({ icon: 'success', title: 'บันทึกสำเร็จ', text: 'อัปเดตเรทราคาสำเร็จ', confirmButtonColor: '#2563eb' });
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
        
        // แก้ไขให้รูปหลักฐานใช้คลาส receipt-img
        let proofImg = r.image_file ? `<img src="${r.image_file}" class="receipt-img">` : '';
        
        container.innerHTML += `<div class="white-card d-flex flex-column flex-md-row justify-content-between align-items-start gap-4">
            <div class="flex-grow-1" style="width: 100%;">
                <div class="fw-bold fs-6 mb-2" style="color:#112246;">ผู้เบิก: ${fullName} (รหัส: ${r.user_id})</div>
                <div><strong>วันที่:</strong> ${r.work_date} | <strong>งาน:</strong> ${r.work_detail}</div>
                <div><strong>ประเภท:</strong> ${r.fuel_type} | <strong>ระยะทาง:</strong> ${r.distance_km} กม.</div>
                <div class="fw-bold mt-2 text-success" style="font-size: 18px;">ยอดเงินเบิก: ฿${r.reimbursable_expense}</div>
                ${actionButtons}
            </div>
            <div style="width: 100%; max-width: 250px;">
                ${proofImg}
            </div>
        </div>`;
    });
}

function processApproval(reportId, newStatus) {
    let reports = JSON.parse(localStorage.getItem('reports')); const idx = reports.findIndex(r => r.report_id === reportId);
    if(idx !== -1) {
        if(newStatus === 'N') {
            Swal.fire({ title: 'ปฏิเสธการเบิกจ่าย', text: 'เหตุผลที่ไม่อนุมัติ:', input: 'text', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'ยืนยัน', cancelButtonText: 'ยกเลิก' }).then((result) => {
                if (result.isConfirmed) { reports[idx].reason = result.value || 'ไม่ได้ระบุเหตุผล'; reports[idx].approve_disbursement = newStatus; localStorage.setItem('reports', JSON.stringify(reports)); renderApprovalQueue(); Swal.fire({ icon: 'success', title: 'บันทึกสำเร็จ', showConfirmButton: false, timer: 1500 }); }
            });
        } else {
            Swal.fire({ title: 'ยืนยันการอนุมัติ?', icon: 'question', showCancelButton: true, confirmButtonColor: '#10b981', confirmButtonText: 'อนุมัติ', cancelButtonText: 'ยกเลิก' }).then((result) => {
                if(result.isConfirmed) { reports[idx].approve_disbursement = newStatus; localStorage.setItem('reports', JSON.stringify(reports)); renderApprovalQueue(); Swal.fire({ icon: 'success', title: 'อนุมัติเรียบร้อย', showConfirmButton: false, timer: 1500 }); }
            });
        }
    }
}

function exitSystem() { Swal.fire({ title: 'ออกจากระบบ', icon: 'question', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'ใช่, ออกจากระบบ' }).then((result) => { if(result.isConfirmed) { localStorage.removeItem('session_user_id'); window.location.href = 'login.html'; } }); }