import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAADUqPrDtltsOiTXJ5AcQ07tkWAJdBa54",
    authDomain: "chanchai-office.firebaseapp.com",
    projectId: "chanchai-office",
    storageBucket: "chanchai-office.firebasestorage.app",
    messagingSenderId: "933936461367",
    appId: "1:933936461367:web:4500e6c940133dc5b2b1b2",
    measurementId: "G-9M8LCDB6KV"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let adminSessionId = localStorage.getItem('session_user_id');

document.addEventListener("DOMContentLoaded", () => {
    if (!adminSessionId) { window.location.href = 'login.html'; return; }
    updateHeaderDisplay();
    window.switchAdminTab('profile'); 
    
    document.getElementById('report-filter-user').addEventListener('change', window.renderAllReports);
    document.getElementById('report-filter-month').addEventListener('change', window.renderAllReports);
});

async function updateHeaderDisplay() {
    const docSnap = await getDoc(doc(db, "users", adminSessionId));
    if(docSnap.exists()) {
        const u = docSnap.data();
        document.getElementById('header-user-name').innerText = `${u.firstname} ${u.lastname}`;
        document.getElementById('header-avatar').src = u.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150";
    }
}

window.switchAdminTab = function(tabName) {
    document.querySelectorAll('.adm-tab-view').forEach(view => view.style.display = 'none');
    document.querySelectorAll('.sidebar .menu-item').forEach(item => item.classList.remove('active'));
    document.getElementById(`adm-${tabName}-view`).style.display = 'block';
    if(document.getElementById(`menu-${tabName}`)) document.getElementById(`menu-${tabName}`).classList.add('active');
    
    if(tabName === 'profile') loadAdminProfile();
    if(tabName === 'users') renderEmployeeList();
    if(tabName === 'prices') loadFuelSettings();
    if(tabName === 'approves') renderApprovalQueue();
    if(tabName === 'reports') { populateReportUserDropdown().then(window.renderAllReports); }
}

async function loadAdminProfile() {
    const docSnap = await getDoc(doc(db, "users", adminSessionId));
    if(docSnap.exists()) {
        const u = docSnap.data();
        document.getElementById('adm-prefix').value = u.prefix || "นาย";
        document.getElementById('adm-firstname').value = u.firstname;
        document.getElementById('adm-lastname').value = u.lastname;
        document.getElementById('adm-userid').value = u.user_id;
        document.getElementById('adm-password').value = u.password;
        document.getElementById('adm-phone').value = u.Phone_number || "";
        document.getElementById('adm-avatar-display').src = u.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150";
    }
}

window.updateAdminProfile = async function() {
    const executeUpdate = async (base64Img) => {
        let updateData = {
            prefix: document.getElementById('adm-prefix').value,
            firstname: document.getElementById('adm-firstname').value.trim(),
            lastname: document.getElementById('adm-lastname').value.trim(),
            password: document.getElementById('adm-password').value,
            Phone_number: document.getElementById('adm-phone').value.trim()
        };
        if(base64Img) updateData.avatar = base64Img;
        
        await updateDoc(doc(db, "users", adminSessionId), updateData);
        if(base64Img) document.getElementById('adm-avatar-display').src = base64Img;
        document.getElementById('adm-avatar').value = ''; 
        updateHeaderDisplay();
        Swal.fire({ icon: 'success', title: 'อัปเดตสำเร็จ', text: 'บันทึกข้อมูลเรียบร้อย' });
    };

    const fileInput = document.getElementById('adm-avatar');
    if (fileInput.files.length > 0) {
        const reader = new FileReader();
        reader.onload = function(e) { executeUpdate(e.target.result); };
        reader.readAsDataURL(fileInput.files[0]);
    } else { executeUpdate(null); }
}

async function renderEmployeeList() {
    const tbody = document.getElementById('admin-user-tbody');
    tbody.innerHTML = '<tr><td colspan="7">กำลังโหลดข้อมูล...</td></tr>';
    
    const querySnapshot = await getDocs(collection(db, "users"));
    tbody.innerHTML = '';
    let idx = 1;
    querySnapshot.forEach((docSnap) => {
        const u = docSnap.data();
        let actionBtns = u.user_id === adminSessionId ? '<span class="text-muted" style="font-size:12px;">(บัญชีของคุณ)</span>' : `<button class="btn-pill btn-edit py-1 px-2 me-1" style="font-size:12px;" onclick="window.editUser('${u.user_id}')">✏️ แก้ไข</button> <button class="btn-pill btn-red py-1 px-2" style="font-size:12px;" onclick="window.deleteUser('${u.user_id}')">🗑️ ลบ</button>`;
        let roleBadge = u.role === 'admin' ? '<span class="badge bg-primary">Admin</span>' : '<span class="badge bg-secondary">User</span>';
        let avatarImg = u.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150";
        tbody.innerHTML += `<tr><td>${idx++}</td><td><img src="${avatarImg}" class="avatar-sm"></td><td><strong>${u.user_id}</strong> <br>${roleBadge}</td><td>${u.prefix || ''}${u.firstname} ${u.lastname}</td><td>${u.job_position || 'พนักงาน'}</td><td>${u.Phone_number || '-'}</td><td>${actionBtns}</td></tr>`;
    });
}

window.addNewUser = function() {
    Swal.fire({
        title: 'เพิ่มพนักงานใหม่',
        html: `<input id="swal-uid" class="swal2-input" placeholder="รหัสพนักงาน (Username)" style="width: 80%;">
               <input id="swal-pass" class="swal2-input" placeholder="รหัสผ่าน (Password)" style="width: 80%;">
               <input id="swal-fname" class="swal2-input" placeholder="ชื่อจริง" style="width: 80%;">
               <input id="swal-lname" class="swal2-input" placeholder="นามสกุล" style="width: 80%;">
               <input id="swal-position" class="swal2-input" placeholder="ตำแหน่งงาน" style="width: 80%;">
               <input id="swal-dept" class="swal2-input" placeholder="แผนก" style="width: 80%;">
               <input id="swal-loc" class="swal2-input" placeholder="สถานที่ปฏิบัติงาน" style="width: 80%;">
               <input id="swal-phone" class="swal2-input" placeholder="เบอร์โทรศัพท์" style="width: 80%;">
               <input id="swal-sdate" class="swal2-input" type="date" style="width: 80%;">
               <select id="swal-role" class="swal2-input" style="width: 80%;"><option value="user">User</option><option value="admin">Admin</option></select>`,
        showCancelButton: true, confirmButtonText: 'บันทึก',
        preConfirm: () => {
            const uid = document.getElementById('swal-uid').value.trim();
            if(!uid) { Swal.showValidationMessage('กรุณากรอกรหัสพนักงาน'); return false; }
            return {
                user_id: uid, password: document.getElementById('swal-pass').value, firstname: document.getElementById('swal-fname').value, lastname: document.getElementById('swal-lname').value,
                job_position: document.getElementById('swal-position').value || 'พนักงานทั่วไป', Department: document.getElementById('swal-dept').value || '-', work_location: document.getElementById('swal-loc').value || '-', Phone_number: document.getElementById('swal-phone').value || '-', start_date: document.getElementById('swal-sdate').value || '', role: document.getElementById('swal-role').value
            }
        }
    }).then(async (result) => {
        if (result.isConfirmed) {
            let data = result.value;
            const existing = await getDoc(doc(db, "users", data.user_id));
            if(existing.exists()){ return Swal.fire('ข้อผิดพลาด', 'รหัสพนักงานนี้มีอยู่แล้ว!', 'error'); }
            data.avatar = "";
            await setDoc(doc(db, "users", data.user_id), data);
            renderEmployeeList();
            Swal.fire('สำเร็จ', 'เพิ่มพนักงานใหม่เรียบร้อย', 'success');
        }
    });
}

window.deleteUser = function(uid) {
    Swal.fire({ title: 'ต้องการลบพนักงานคนนี้ใช่หรือไม่?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'ลบทิ้ง' }).then(async (result) => {
        if (result.isConfirmed) { await deleteDoc(doc(db, "users", uid)); renderEmployeeList(); Swal.fire('ลบสำเร็จ', '', 'success'); }
    });
}

window.editUser = async function(uid) {
    const docSnap = await getDoc(doc(db, "users", uid));
    if(!docSnap.exists()) return;
    let u = docSnap.data();

    Swal.fire({
        title: `แก้ไขข้อมูล: ${uid}`,
        html: `<input id="swal-edit-fname" class="swal2-input" value="${u.firstname}" placeholder="ชื่อจริง">
               <input id="swal-edit-lname" class="swal2-input" value="${u.lastname}" placeholder="นามสกุล">
               <input id="swal-edit-position" class="swal2-input" value="${u.job_position || ''}" placeholder="ตำแหน่ง">
               <select id="swal-edit-role" class="swal2-input" style="width: 80%;"><option value="user" ${u.role==='user'?'selected':''}>User</option><option value="admin" ${u.role==='admin'?'selected':''}>Admin</option></select>`,
        showCancelButton: true, confirmButtonText: 'บันทึก'
    }).then(async (result) => {
        if (result.isConfirmed) {
            await updateDoc(doc(db, "users", uid), {
                firstname: document.getElementById('swal-edit-fname').value, 
                lastname: document.getElementById('swal-edit-lname').value, 
                job_position: document.getElementById('swal-edit-position').value,
                role: document.getElementById('swal-edit-role').value
            });
            renderEmployeeList(); Swal.fire('บันทึกสำเร็จ', '', 'success');
        }
    });
}

async function populateReportUserDropdown() {
    const select = document.getElementById('report-filter-user');
    const currentValue = select.value;
    select.innerHTML = '<option value="">-- แสดงพนักงานทุกคน --</option>';
    
    const querySnapshot = await getDocs(collection(db, "users"));
    querySnapshot.forEach(docSnap => {
        const u = docSnap.data();
        if (u.role !== 'admin') select.innerHTML += `<option value="${u.user_id}">${u.firstname} ${u.lastname} (${u.user_id})</option>`;
    });
    select.value = currentValue;
}

window.renderAllReports = async function() {
    const tbody = document.getElementById('admin-reports-tbody');
    const filterUser = document.getElementById('report-filter-user').value;
    const filterMonth = document.getElementById('report-filter-month').value;
    
    const querySnapshot = await getDocs(collection(db, "fuel"));
    let reports = [];
    querySnapshot.forEach(docSnap => reports.push({ id: docSnap.id, ...docSnap.data() }));
    
    let filtered = reports.filter(r => {
        return (!filterUser || r.user_id === filterUser) && (!filterMonth || r.work_date.startsWith(filterMonth));
    });

    tbody.innerHTML = '';
    if (filtered.length === 0) { 
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">ไม่พบข้อมูลรายงานในเงื่อนไขนี้</td></tr>'; 
        document.getElementById('rep-sum-count').innerText = `0 รายการ`;
        document.getElementById('rep-sum-km').innerText = `0 กม.`;
        document.getElementById('rep-sum-total').innerText = `฿0.00`;
        return; 
    }
    
    let totalKm = 0, totalBaht = 0;
    filtered.forEach(r => {
        let statusText = r.Approve_disbursement === 'P' ? 'รออนุมัติ' : (r.Approve_disbursement === 'Y' ? 'อนุมัติ' : 'ไม่อนุมัติ');
        if(r.Approve_disbursement !== 'N') {
            totalKm += parseFloat(r.distance_km) || 0; 
            totalBaht += parseFloat(r.Reimbursable_expense) || 0;
        }
        tbody.innerHTML += `<tr><td>${r.work_date}</td><td><strong>${r.user_id}</strong></td><td>${r.work_detail}</td><td>${r.fuel_type || 'ทั่วไป'}</td><td>${r.distance_km}</td><td class="text-success">฿${r.Reimbursable_expense}</td><td><span class="status-tag status-${r.Approve_disbursement}">${statusText}</span></td></tr>`;
    });
    document.getElementById('rep-sum-count').innerText = `${filtered.length} รายการ`;
    document.getElementById('rep-sum-km').innerText = `${totalKm.toFixed(2)} กม.`;
    document.getElementById('rep-sum-total').innerText = `฿${totalBaht.toFixed(2)}`;
}

async function renderApprovalQueue() {
    const container = document.getElementById('admin-verification-queue'); 
    container.innerHTML = '<div class="text-center p-3">กำลังโหลดรายการขออนุมัติ...</div>';
    
    const reportsSnap = await getDocs(collection(db, "fuel"));
    const usersSnap = await getDocs(collection(db, "users"));
    
    let usersMap = {};
    usersSnap.forEach(u => usersMap[u.data().user_id] = u.data());
    
    let reports = [];
    reportsSnap.forEach(r => reports.push({ id: r.id, ...r.data() }));
    let pendingReports = reports.filter(r => r.Approve_disbursement === 'P');

    container.innerHTML = '';
    if (pendingReports.length === 0) { container.innerHTML = '<div class="text-center p-4 text-muted">🎉 ยอดเยี่ยม! ไม่มีรายการตกค้างรออนุมัติ</div>'; return; }
    
    pendingReports.forEach(r => {
        let u = usersMap[r.user_id] || {};
        let actionButtons = `<div class="mt-3"><button class="btn-pill btn-green me-2 py-1 px-3" onclick="window.processApproval('${r.id}', 'Y')">✔️ อนุมัติ</button><button class="btn-pill btn-red py-1 px-3" onclick="window.processApproval('${r.id}', 'N')">❌ ไม่อนุมัติ</button></div>`;
        let proofImg = r.Image_file ? `<img src="${r.Image_file}" class="receipt-img" style="max-width:200px; max-height:150px; cursor:pointer;" onclick="window.open('${r.Image_file}')">` : '<span class="text-muted">ไม่มีรูปแนบ</span>';
        
        container.innerHTML += `<div class="white-card d-flex justify-content-between align-items-center mb-3 p-3 border rounded shadow-sm">
            <div>
                <div class="fw-bold fs-5 text-dark">ผู้ขอเบิก: ${u.firstname || 'ไม่ทราบชื่อ'} (${r.user_id})</div>
                <div class="text-secondary mt-1">วันที่ทำงาน: <strong>${r.work_date}</strong></div>
                <div class="text-secondary">รายละเอียด: ${r.work_detail}</div>
                <div class="mt-2 text-primary fw-bold">ระยะทาง: ${r.distance_km} กม. | ยอดเงินเบิก: ฿${r.Reimbursable_expense}</div>
                ${actionButtons}
            </div>
            <div class="text-center">${proofImg}</div>
        </div>`;
    });
}

window.processApproval = function(reportId, newStatus) {
    if(newStatus === 'N') {
        Swal.fire({ title: 'ปฏิเสธการเบิกจ่าย', text: 'ระบุเหตุผลที่ไม่อนุมัติ:', input: 'text', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'ยืนยันปฏิเสธ' }).then(async (result) => {
            if (result.isConfirmed) { 
                await updateDoc(doc(db, "fuel", reportId), { Approve_disbursement: 'N', reason: result.value || 'ไม่ได้ระบุเหตุผล' });
                renderApprovalQueue(); Swal.fire('บันทึกสำเร็จ', 'ปฏิเสธคำขอแล้ว', 'success'); 
            }
        });
    } else {
        Swal.fire({ title: 'ยืนยันการอนุมัติยอดเงินนี้?', icon: 'question', showCancelButton: true, confirmButtonColor: '#10b981', confirmButtonText: 'อนุมัติจ่ายเงิน' }).then(async (result) => {
            if(result.isConfirmed) { 
                await updateDoc(doc(db, "fuel", reportId), { Approve_disbursement: 'Y' });
                renderApprovalQueue(); Swal.fire('อนุมัติเรียบร้อย', '', 'success'); 
            }
        });
    }
}

async function loadFuelSettings() {
    const tbody = document.getElementById('admin-fuel-tbody'); tbody.innerHTML = '<tr><td colspan="5">กำลังโหลดข้อมูลราคาน้ำมัน...</td></tr>';
    const q = await getDocs(collection(db, "fuels"));
    tbody.innerHTML = '';
    q.forEach(docSnap => {
        const f = docSnap.data();
        tbody.innerHTML += `<tr><td>${f.id}</td><td>${f.type}</td><td><strong>${f.name}</strong></td><td>${f.rate} บาท/กม.</td><td><button class="btn-pill btn-red py-1 px-2" style="font-size:12px;" onclick="window.deleteFuel('${f.id}')">🗑️ ลบ</button></td></tr>`;
    });
}

window.addNewFuel = function() {
    Swal.fire({
        title: 'เพิ่มประเภทเชื้อเพลิง/ราคากลาง',
        html: `<input id="swal-f-name" class="swal2-input" placeholder="เช่น ดีเซล B7, EV Charge">
               <input id="swal-f-rate" class="swal2-input" type="number" step="0.01" placeholder="บาท ต่อ กิโลเมตร">
               <select id="swal-f-type" class="swal2-input"><option value="น้ำมัน">น้ำมัน</option><option value="ไฟฟ้า">ไฟฟ้า</option><option value="แก๊ส">แก๊ส</option></select>`,
        showCancelButton: true, confirmButtonText: 'บันทึก',
        preConfirm: () => { return { name: document.getElementById('swal-f-name').value, rate: parseFloat(document.getElementById('swal-f-rate').value), type: document.getElementById('swal-f-type').value } }
    }).then(async (result) => {
        if(result.isConfirmed && result.value.name && !isNaN(result.value.rate)) {
            let id = "FUEL" + Date.now();
            await setDoc(doc(db, "fuels", id), { id: id, ...result.value });
            loadFuelSettings(); Swal.fire('สำเร็จ', 'บันทึกราคากลางแล้ว', 'success');
        }
    });
}

window.deleteFuel = function(id) {
    Swal.fire({ title: 'ลบประเภทเชื้อเพลิงนี้?', icon: 'warning', showCancelButton: true }).then(async (result) => {
        if (result.isConfirmed) { await deleteDoc(doc(db, "fuels", id)); loadFuelSettings(); Swal.fire('ลบสำเร็จ', '', 'success'); }
    });
}

window.printReport = function() { window.print(); }
window.exitSystem = function() { localStorage.removeItem('session_user_id'); window.location.href = 'login.html'; }