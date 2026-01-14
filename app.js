// فئة الكتاب
class Book {
    constructor(title, author, year, publisher = '', category = '', notes = '') {
        this.id = Date.now() + Math.random().toString(36).substr(2, 9);
        this.title = title;
        this.author = author;
        this.year = year;
        this.publisher = publisher;
        this.category = category;
        this.notes = notes;
        this.createdAt = new Date().toLocaleDateString('ar-SA');
    }
}

// إدارة التخزين
class LibraryStorage {
    static getBooks() {
        return JSON.parse(localStorage.getItem('library_books')) || [];
    }
    
    static saveBooks(books) {
        localStorage.setItem('library_books', JSON.stringify(books));
        this.updateStats();
    }
    
    static addBook(book) {
        const books = this.getBooks();
        books.push(book);
        this.saveBooks(books);
    }
    
    static updateBook(id, updatedBook) {
        const books = this.getBooks();
        const index = books.findIndex(book => book.id === id);
        if (index !== -1) {
            books[index] = { ...books[index], ...updatedBook };
            this.saveBooks(books);
        }
    }
    
    static deleteBook(id) {
        const books = this.getBooks().filter(book => book.id !== id);
        this.saveBooks(books);
    }
    
    static clearAll() {
        if (confirm('هل أنت متأكد من حذف جميع الكتب؟ لا يمكن التراجع عن هذا الإجراء.')) {
            localStorage.removeItem('library_books');
            this.updateStats();
            renderBooks();
        }
    }
    
    static updateStats() {
        const books = this.getBooks();
        const authors = [...new Set(books.map(book => book.author))];
        const oldestBook = books.length > 0 ? 
            books.reduce((oldest, current) => 
                (current.year < oldest.year) ? current : oldest
            ) : null;
        
        document.getElementById('totalBooks').textContent = books.length;
        document.getElementById('totalAuthors').textContent = authors.length;
        document.getElementById('oldestBook').textContent = oldestBook ? oldestBook.year : '-';
        
        // تحديث حجم التخزين
        const data = localStorage.getItem('library_books') || '';
        const storageKB = (data.length * 2) / 1024;
        document.getElementById('storageUsed').textContent = storageKB.toFixed(2);
    }
}

// عرض الكتب
function renderBooks(filteredBooks = null) {
    const books = filteredBooks || LibraryStorage.getBooks();
    const tbody = document.getElementById('booksBody');
    const bookCount = document.getElementById('bookCount');
    
    tbody.innerHTML = '';
    bookCount.textContent = books.length;
    
    if (books.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 50px;">
                    <i class="fas fa-book" style="font-size: 3em; color: #ccc; margin-block-end: 20px;"></i>
                    <h3 style="color: #666;">لا توجد كتب في المكتبة</h3>
                    <p>ابدأ بإضافة كتبك الأولى!</p>
                </td>
            </tr>
        `;
        return;
    }
    
    books.forEach((book, index) => {
        const row = document.createElement('tr');
        
        // تحديد لون التصنيف
        const badgeClass = book.category ? `badge-${book.category.toLowerCase().replace(' ', '-')}` : 'badge-other';
        const badgeText = book.category || 'غير مصنف';
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>
                <i class="fas fa-book book-icon"></i>
                <strong>${book.title}</strong>
                ${book.notes ? `<br><small style="color: #666;">${book.notes}</small>` : ''}
            </td>
            <td><i class="fas fa-user-pen"></i> ${book.author}</td>
            <td>${book.year || 'غير محدد'}</td>
            <td><span class="badge ${badgeClass}">${badgeText}</span></td>
            <td>${book.publisher || '-'}</td>
            <td><i class="far fa-calendar"></i> ${book.createdAt}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn edit-btn" onclick="editBook('${book.id}')">
                        <i class="fas fa-edit"></i> تعديل
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteBook('${book.id}')">
                        <i class="fas fa-trash"></i> حذف
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    // تحديث التصفيات
    updateFilters();
}

// إضافة كتاب جديد
document.getElementById('bookForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const title = document.getElementById('title').value.trim();
    const author = document.getElementById('author').value.trim();
    const year = document.getElementById('year').value;
    const publisher = document.getElementById('publisher').value.trim();
    const category = document.getElementById('category').value;
    const notes = document.getElementById('notes').value.trim();
    
    if (!title || !author) {
        alert('الرجاء إدخال عنوان الكتاب واسم المؤلف');
        return;
    }
    
    const book = new Book(title, author, year, publisher, category, notes);
    LibraryStorage.addBook(book);
    renderBooks();
    this.reset();
    
    // إشعار
    showNotification('تم إضافة الكتاب بنجاح!', 'success');
});

// حذف كتاب
function deleteBook(id) {
    if (confirm('هل أنت متأكد من حذف هذا الكتاب؟')) {
        LibraryStorage.deleteBook(id);
        renderBooks();
        showNotification('تم حذف الكتاب بنجاح', 'warning');
    }
}

// تعديل كتاب
function editBook(id) {
    const books = LibraryStorage.getBooks();
    const book = books.find(b => b.id === id);
    if (!book) return;
    
    const form = document.getElementById('editForm');
    form.innerHTML = `
        <div class="form-group">
            <input type="text" id="editTitle" value="${book.title}" placeholder="عنوان الكتاب" required>
        </div>
        <div class="form-group">
            <input type="text" id="editAuthor" value="${book.author}" placeholder="اسم المؤلف" required>
        </div>
        <div class="form-group">
            <input type="number" id="editYear" value="${book.year || ''}" placeholder="سنة النشر">
        </div>
        <div class="form-group">
            <input type="text" id="editPublisher" value="${book.publisher || ''}" placeholder="دار النشر">
        </div>
        <div class="form-group">
            <select id="editCategory">
                <option value="" ${!book.category ? 'selected' : ''}>اختر التصنيف</option>
                <option value="أدب" ${book.category === 'أدب' ? 'selected' : ''}>أدب</option>
                <option value="علمي" ${book.category === 'علمي' ? 'selected' : ''}>علمي</option>
                <option value="تاريخ" ${book.category === 'تاريخ' ? 'selected' : ''}>تاريخ</option>
                <option value="ديني" ${book.category === 'ديني' ? 'selected' : ''}>ديني</option>
                <option value="فلسفة" ${book.category === 'فلسفة' ? 'selected' : ''}>فلسفة</option>
                <option value="أخرى" ${book.category === 'أخرى' ? 'selected' : ''}>أخرى</option>
            </select>
        </div>
        <div class="form-group">
            <textarea id="editNotes" placeholder="ملاحظات إضافية..." rows="3">${book.notes || ''}</textarea>
        </div>
        <div style="display: flex; gap: 15px; margin-block-start: 20px;">
            <button type="submit" class="btn btn-primary">
                <i class="fas fa-save"></i> حفظ التعديلات
            </button>
            <button type="button" class="btn btn-secondary" onclick="closeModal()">
                <i class="fas fa-times"></i> إلغاء
            </button>
        </div>
    `;
    
    form.onsubmit = function(e) {
        e.preventDefault();
        const updatedBook = {
            title: document.getElementById('editTitle').value.trim(),
            author: document.getElementById('editAuthor').value.trim(),
            year: document.getElementById('editYear').value,
            publisher: document.getElementById('editPublisher').value.trim(),
            category: document.getElementById('editCategory').value,
            notes: document.getElementById('editNotes').value.trim()
        };
        
        LibraryStorage.updateBook(id, updatedBook);
        renderBooks();
        closeModal();
        showNotification('تم تحديث الكتاب بنجاح', 'success');
    };
    
    document.getElementById('editModal').style.display = 'flex';
}

// البحث والتصفية
document.getElementById('searchInput').addEventListener('input', filterBooks);

function filterBooks() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const categoryFilter = document.getElementById('filterCategory').value;
    const yearFilter = document.getElementById('filterYear').value;
    
    const books = LibraryStorage.getBooks();
    
    const filtered = books.filter(book => {
        const matchesSearch = !searchTerm || 
            book.title.toLowerCase().includes(searchTerm) || 
            book.author.toLowerCase().includes(searchTerm) ||
            (book.notes && book.notes.toLowerCase().includes(searchTerm));
        
        const matchesCategory = !categoryFilter || book.category === categoryFilter;
        const matchesYear = !yearFilter || book.year === yearFilter;
        
        return matchesSearch && matchesCategory && matchesYear;
    });
    
    renderBooks(filtered);
}

// تحديث خيارات التصفية
function updateFilters() {
    const books = LibraryStorage.getBooks();
    const categories = [...new Set(books.map(book => book.category).filter(Boolean))];
    const years = [...new Set(books.map(book => book.year).filter(Boolean))].sort((a, b) => b - a);
    
    const categorySelect = document.getElementById('filterCategory');
    const yearSelect = document.getElementById('filterYear');
    
    // تحديث التصنيفات
    categorySelect.innerHTML = '<option value="">جميع التصنيفات</option>';
    categories.forEach(category => {
        categorySelect.innerHTML += `<option value="${category}">${category}</option>`;
    });
    
    // تحديث السنوات
    yearSelect.innerHTML = '<option value="">جميع السنوات</option>';
    years.forEach(year => {
        yearSelect.innerHTML += `<option value="${year}">${year}</option>`;
    });
}

// تصدير البيانات
function exportData() {
    const books = LibraryStorage.getBooks();
    const dataStr = JSON.stringify(books, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `مكتبتي_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showNotification('تم تصدير البيانات بنجاح', 'success');
}

// نسخ احتياطي
function backupData() {
    const books = LibraryStorage.getBooks();
    localStorage.setItem('library_backup_' + Date.now(), JSON.stringify(books));
    showNotification('تم إنشاء نسخة احتياطية', 'info');
}

// مسح النموذج
function clearForm() {
    document.getElementById('bookForm').reset();
}

// إغلاق المودال
function closeModal() {
    document.getElementById('editModal').style.display = 'none';
}

// إظهار الإشعارات
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        inset-block-start: 20px;
        inset-inline-start: 50%;
        transform: translateX(-50%);
        background: ${type === 'success' ? '#28a745' : type === 'warning' ? '#dc3545' : '#17a2b8'};
        color: white;
        padding: 15px 30px;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 10000;
        font-weight: 600;
        animation: slideIn 0.3s ease;
    `;
    
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
        ${message}
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// إضافة أنيميشن للإشعارات
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(-50%) translateY(-100px); opacity: 0; }
        to { transform: translateX(-50%) translateY(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(-50%) translateY(0); opacity: 1; }
        to { transform: translateX(-50%) translateY(-100px); opacity: 0; }
    }
`;
document.head.appendChild(style);

// حذف جميع البيانات
function clearAllData() {
    LibraryStorage.clearAll();
}

// تهيئة التطبيق عند التحميل
document.addEventListener('DOMContentLoaded', function() {
    renderBooks();
    LibraryStorage.updateStats();
    
    // إضافة بيانات نموذجية إذا كانت المكتبة فارغة
    if (LibraryStorage.getBooks().length === 0) {
        const sampleBooks = [
            new Book('الأيام', 'طه حسين', 1929, 'دار المعارف', 'أدب', 'سيرة ذاتية'),
            new Book('قصة الحضارة', 'ويل ديورانت', 1935, 'مؤسسة هنداوي', 'تاريخ', 'موسوعة تاريخية'),
            new Book('الكون', 'كارل ساجان', 1980, 'دار التنوير', 'علمي', 'علم الفلك للجميع'),
            new Book('كليلة ودمنة', 'ابن المقفع', 750, 'دار صادر', 'أدب', 'حكايات أخلاقية')
        ];
        
        sampleBooks.forEach(book => LibraryStorage.addBook(book));
        renderBooks();
        showNotification('تم تحميل بيانات تجريبية للمكتبة', 'info');
    }
});


// لضمان عدم فقدان البيانات:
// 1. تصدير دوري للبيانات
function createAutoBackup() {
    setInterval(() => {
        const books = LibraryStorage.getBooks();
        const backup = JSON.stringify(books);
        localStorage.setItem('backup_' + Date.now(), backup);
    }, 24 * 60 * 60 * 1000); // يومياً
}

// 2. تحذير عند اقتراب السعة القصوى
function checkStorageLimit() {
    const used = JSON.stringify(localStorage).length;
    const max = 5 * 1024 * 1024; // 5 ميجابايت
    if (used > max * 0.8) {
        alert('مساحة التخزين قاربت على الامتلاء! يرجى تصدير البيانات.');
    }
}

// في app.js - أضف هذه الدوال

class DataManager {
    // استعادة من نسخ احتياطية
    static restoreFromBackup() {
        const backups = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('backup_')) {
                backups.push({
                    key: key,
                    date: new Date(parseInt(key.split('_')[1])),
                    data: JSON.parse(localStorage.getItem(key))
                });
            }
        }
        
        // استعادة آخر نسخة
        if (backups.length > 0) {
            const latest = backups.sort((a, b) => b.date - a.date)[0];
            return latest.data;
        }
        return null;
    }
    
    // نسخ إلى ملف نصي
    static saveToTextFile() {
        const books = LibraryStorage.getBooks();
        let textContent = "مكتبتي الشخصية - تصدير البيانات\n";
        textContent += "=".repeat(50) + "\n\n";
        
        books.forEach((book, index) => {
            textContent += `الكتاب ${index + 1}:\n`;
            textContent += `- العنوان: ${book.title}\n`;
            textContent += `- المؤلف: ${book.author}\n`;
            textContent += `- السنة: ${book.year || 'غير محدد'}\n`;
            textContent += `- التصنيف: ${book.category || 'غير مصنف'}\n`;
            textContent += `- دار النشر: ${book.publisher || '-'}\n`;
            textContent += `- الملاحظات: ${book.notes || 'لا توجد'}\n`;
            textContent += "-".repeat(30) + "\n";
        });
        
        const blob = new Blob([textContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `مكتبتي_${new Date().toLocaleDateString('ar-SA')}.txt`;
        a.click();
    }
    
    // استيراد من ملف JSON
    static importFromJSON(event) {
        const file = event.target.files[0];
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const importedBooks = JSON.parse(e.target.result);
                if (Array.isArray(importedBooks)) {
                    LibraryStorage.saveBooks(importedBooks);
                    renderBooks();
                    showNotification('تم استيراد البيانات بنجاح!', 'success');
                }
            } catch (error) {
                alert('خطأ في تنسيق الملف!');
            }
        };
        
        reader.readAsText(file);
    }
}

// ====================== نظام التصدير العربي المتكامل ======================

// 📊 نظام التصدير الاحترافي الكامل - يعمل مباشرة
class ProfessionalExporter {
    
    // ====================== 1. تصدير Excel احترافي ======================
    static exportExcel() {
        try {
            this.showProgress('جاري تحضير بيانات Excel...', 10);
            
            // الحصول على الكتب
            const books = this.getBooks();
            if (!books || books.length === 0) {
                this.showAlert('لا توجد كتب للتصدير', 'warning');
                this.hideProgress();
                return;
            }
            
            this.showProgress('جاري تنظيم البيانات...', 30);
            
            // إنشاء محتوى Excel
            const excelContent = this.createExcelFile(books);
            
            this.showProgress('جاري حفظ الملف...', 80);
            
            // حفظ وتنزيل الملف
            const blob = new Blob([excelContent], { 
                type: 'application/vnd.ms-excel' 
            });
            const fileName = `مكتبتي_${this.getTodayDate()}.xls`;
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
            
            this.showProgress('تم! ✅', 100);
            
            setTimeout(() => {
                this.hideProgress();
                this.showAlert(`تم تصدير ${books.length} كتاب إلى Excel`, 'success');
            }, 1000);
            
        } catch (error) {
            this.hideProgress();
            this.showAlert('خطأ في Excel: ' + error.message, 'warning');
        }
    }
    
    static createExcelFile(books) {
        const stats = this.getStats(books);
        const categories = this.groupCategories(books);
        
        return `
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial; direction: rtl; }
                .header { 
                    background: #2c3e50; 
                    color: white; 
                    padding: 20px; 
                    text-align: center; 
                }
                table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin: 20px 0; 
                }
                th { 
                    background: #4a6491; 
                    color: white; 
                    padding: 12px; 
                    border: 1px solid #ddd; 
                }
                td { 
                    padding: 10px; 
                    border: 1px solid #ddd; 
                    text-align: right; 
                }
                tr:nth-child(even) { background: #f9f9f9; }
                .badge { 
                    padding: 4px 10px; 
                    border-radius: 12px; 
                    color: white; 
                    font-size: 12px; 
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>📚 مكتبتي الشخصية</h1>
                <p>${this.getTodayDate()} | ${books.length} كتاب</p>
            </div>
            
            <table>
                <tr>
                    <th>#</th><th>العنوان</th><th>المؤلف</th>
                    <th>السنة</th><th>التصنيف</th><th>الناشر</th><th>التاريخ</th>
                </tr>
                ${books.map((book, i) => `
                    <tr>
                        <td>${i+1}</td>
                        <td><strong>${this.cleanText(book.title)}</strong></td>
                        <td>${this.cleanText(book.author)}</td>
                        <td>${book.year || ''}</td>
                        <td>
                            ${book.category ? `
                            <span class="badge" style="background:${this.getColor(book.category)}">
                                ${book.category}
                            </span>
                            ` : '-'}
                        </td>
                        <td>${this.cleanText(book.publisher) || '-'}</td>
                        <td>${book.createdAt || ''}</td>
                    </tr>
                `).join('')}
            </table>
            
            <!-- صفحة الإحصائيات -->
            <div style="page-break-before: always; padding: 30px;">
                <h2>📊 إحصائيات</h2>
                <table>
                    <tr><td>إجمالي الكتب</td><td><strong>${stats.total}</strong></td></tr>
                    <tr><td>عدد المؤلفين</td><td><strong>${stats.authors}</strong></td></tr>
                    <tr><td>عدد التصنيفات</td><td><strong>${stats.categories}</strong></td></tr>
                </table>
            </div>
        </body>
        </html>`;
    }
    
    // ====================== 2. تصدير PDF ======================
    static exportPDF() {
        try {
            this.showProgress('جاري إنشاء PDF...', 20);
            
            const books = this.getBooks();
            if (!books || books.length === 0) {
                this.showAlert('لا توجد كتب للتصدير', 'warning');
                this.hideProgress();
                return;
            }
            
            // فتح نافذة طباعة
            const win = window.open('', '_blank');
            if (!win) {
                this.showAlert('السماح بالنوافذ المنبثقة', 'warning');
                this.hideProgress();
                return;
            }
            
            win.document.write(this.createPDF(books));
            win.document.close();
            
            this.showProgress('جاري المعاينة...', 90);
            
            setTimeout(() => {
                win.focus();
                win.print();
                this.hideProgress();
                this.showAlert('اختر "حفظ كـ PDF" في نافذة الطباعة', 'info');
            }, 1000);
            
        } catch (error) {
            this.hideProgress();
            this.showAlert('خطأ في PDF: ' + error.message, 'warning');
        }
    }
    
    static createPDF(books) {
        return `
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>مكتبتي</title>
            <style>
                @media print { @page { margin: 20mm; } }
                body { font-family: Arial; direction: rtl; padding: 20px; }
                h1 { color: #2c3e50; text-align: center; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #000; padding: 8px; text-align: right; }
                th { background: #4a6491; color: white; }
            </style>
        </head>
        <body>
            <h1>مكتبتي (${books.length})</h1>
            <p style="text-align: center;">${this.getTodayDate()}</p>
            <table>
                <tr>
                    <th>#</th><th>العنوان</th><th>المؤلف</th>
                    <th>السنة</th><th>التصنيف</th><th>التاريخ</th>
                </tr>
                ${books.map((book, i) => `
                    <tr>
                        <td>${i+1}</td>
                        <td>${this.cleanText(book.title)}</td>
                        <td>${this.cleanText(book.author)}</td>
                        <td>${book.year || ''}</td>
                        <td>${book.category || ''}</td>
                        <td>${book.createdAt || ''}</td>
                    </tr>
                `).join('')}
            </table>
            <script>window.onload = () => window.print();</script>
        </body>
        </html>`;
    }
    
    // ====================== 3. تصدير CSV ======================
    static exportCSV() {
        try {
            this.showProgress('جاري إنشاء CSV...', 30);
            
            const books = this.getBooks();
            if (!books || books.length === 0) {
                this.showAlert('لا توجد كتب', 'warning');
                this.hideProgress();
                return;
            }
            
            // إنشاء CSV
            let csv = '\uFEFF'; // BOM للعربية
            csv += 'رقم,العنوان,المؤلف,السنة,التصنيف,الناشر,ملاحظات,التاريخ\n';
            
            books.forEach((book, i) => {
                const row = [
                    i+1,
                    this.csvEscape(book.title),
                    this.csvEscape(book.author),
                    book.year || '',
                    this.csvEscape(book.category || ''),
                    this.csvEscape(book.publisher || ''),
                    this.csvEscape(book.notes || ''),
                    book.createdAt || ''
                ];
                csv += row.join(',') + '\n';
            });
            
            // تنزيل
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
            const fileName = `مكتبتي_${this.getTodayDate()}.csv`;
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = fileName;
            link.click();
            
            this.showProgress('تم! ✅', 100);
            
            setTimeout(() => {
                this.hideProgress();
                this.showAlert(`تم تصدير ${books.length} كتاب إلى CSV`, 'success');
            }, 1000);
            
        } catch (error) {
            this.hideProgress();
            this.showAlert('خطأ في CSV: ' + error.message, 'warning');
        }
    }
    
    // ====================== 4. تصدير HTML ======================
    static exportHTML() {
        try {
            this.showProgress('جاري إنشاء صفحة ويب...', 40);
            
            const books = this.getBooks();
            if (!books || books.length === 0) {
                this.showAlert('لا توجد كتب', 'warning');
                this.hideProgress();
                return;
            }
            
            const html = this.createWebPage(books);
            
            // تنزيل
            const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
            const fileName = `مكتبتي_${this.getTodayDate()}.html`;
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = fileName;
            link.click();
            
            this.showProgress('تم! ✅', 100);
            
            setTimeout(() => {
                this.hideProgress();
                this.showAlert(`تم تصدير ${books.length} كتاب إلى صفحة ويب`, 'success');
            }, 1000);
            
        } catch (error) {
            this.hideProgress();
            this.showAlert('خطأ في HTML: ' + error.message, 'warning');
        }
    }
    
    static createWebPage(books) {
        const stats = this.getStats(books);
        
        return `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="UTF-8">
            <title>مكتبتي</title>
            <style>
                body { 
                    font-family: Arial; 
                    direction: rtl; 
                    padding: 20px; 
                    background: #f5f7fa; 
                }
                .container { 
                    max-width: 1000px; 
                    margin: auto; 
                    background: white; 
                    padding: 30px; 
                    border-radius: 15px; 
                    box-shadow: 0 5px 20px rgba(0,0,0,0.1); 
                }
                h1 { color: #2c3e50; text-align: center; }
                table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin: 20px 0; 
                }
                th { 
                    background: #4a6491; 
                    color: white; 
                    padding: 12px; 
                    text-align: right; 
                }
                td { 
                    padding: 10px; 
                    border-bottom: 1px solid #eee; 
                    text-align: right; 
                }
                tr:hover { background: #f9f9f9; }
                .stats { 
                    display: flex; 
                    gap: 20px; 
                    margin: 30px 0; 
                    flex-wrap: wrap; 
                }
                .stat-box { 
                    flex: 1; 
                    min-width: 200px; 
                    background: #f8f9fa; 
                    padding: 20px; 
                    border-radius: 10px; 
                    text-align: center; 
                }
                .stat-number { 
                    font-size: 2em; 
                    color: #4a6491; 
                    font-weight: bold; 
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>📚 مكتبتي الشخصية</h1>
                <p style="text-align: center; color: #666;">
                    ${this.getTodayDate()} | ${books.length} كتاب
                </p>
                
                <div class="stats">
                    <div class="stat-box">
                        <div class="stat-number">${stats.total}</div>
                        <div>إجمالي الكتب</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-number">${stats.authors}</div>
                        <div>المؤلفون</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-number">${stats.categories}</div>
                        <div>التصنيفات</div>
                    </div>
                </div>
                
                <table>
                    <tr>
                        <th>#</th><th>العنوان</th><th>المؤلف</th>
                        <th>السنة</th><th>التصنيف</th><th>الناشر</th><th>التاريخ</th>
                    </tr>
                    ${books.map((book, i) => `
                        <tr>
                            <td>${i+1}</td>
                            <td><strong>${this.cleanText(book.title)}</strong></td>
                            <td>${this.cleanText(book.author)}</td>
                            <td>${book.year || ''}</td>
                            <td>${book.category || ''}</td>
                            <td>${this.cleanText(book.publisher) || '-'}</td>
                            <td>${book.createdAt || ''}</td>
                        </tr>
                    `).join('')}
                </table>
                
                <p style="text-align: center; color: #999; margin-top: 40px;">
                    تم إنشاء هذه الصفحة تلقائياً من نظام إدارة المكتبة الشخصية
                </p>
            </div>
        </body>
        </html>`;
    }
    
    // ====================== 5. عرض للطباعة ======================
    static showPrintView() {
        try {
            const books = this.getBooks();
            if (!books || books.length === 0) {
                this.showAlert('لا توجد كتب للطباعة', 'warning');
                return;
            }
            
            // نفس كود PDF
            const win = window.open('', '_blank');
            win.document.write(this.createPDF(books));
            win.document.close();
            
            this.showAlert('افتح نافذة الطباعة (Ctrl+P) للطباعة', 'info');
            
        } catch (error) {
            this.showAlert('خطأ: ' + error.message, 'warning');
        }
    }
    
    // ====================== أدوات مساعدة ======================
    static getBooks() {
        try {
            // محاولة الحصول من localStorage مباشرة
            const data = localStorage.getItem('library_books') || 
                        localStorage.getItem('books') || 
                        '[]';
            return JSON.parse(data);
        } catch {
            return [];
        }
    }
    
    static getStats(books) {
        const authors = [...new Set(books.map(b => b.author).filter(Boolean))];
        const categories = [...new Set(books.map(b => b.category).filter(Boolean))];
        
        return {
            total: books.length,
            authors: authors.length,
            categories: categories.length
        };
    }
    
    static groupCategories(books) {
        const groups = {};
        books.forEach(book => {
            const cat = book.category || 'غير مصنف';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(book);
        });
        return groups;
    }
    
    static getColor(category) {
        const colors = {
            'أدب': '#3498db',
            'علمي': '#2ecc71',
            'تاريخ': '#e74c3c',
            'ديني': '#9b59b6',
            'فلسفة': '#f39c12'
        };
        return colors[category] || '#95a5a6';
    }
    
    static getTodayDate() {
        return new Date().toLocaleDateString('ar-SA');
    }
    
    static cleanText(text) {
        return (text || '').toString().trim();
    }
    
    static csvEscape(text) {
        const str = (text || '').toString();
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
    }
    
    static showProgress(message, percent) {
        const bar = document.getElementById('exportProgress');
        const fill = document.getElementById('progressFill');
        const text = document.getElementById('progressText');
        
        if (bar) bar.style.display = 'block';
        if (fill) fill.style.width = percent + '%';
        if (text) text.textContent = message;
    }
    
    static hideProgress() {
        const bar = document.getElementById('exportProgress');
        if (bar) {
            setTimeout(() => {
                bar.style.display = 'none';
                const fill = document.getElementById('progressFill');
                if (fill) fill.style.width = '0%';
            }, 500);
        }
    }
    
    static showAlert(message, type = 'info') {
        // استخدام showNotification إذا كان موجوداً
        if (typeof showNotification === 'function') {
            showNotification(message, type);
        } else {
            // عرض رسالة بسيطة
            alert(message);
        }
    }

} // <-- نهاية الكلاس ProfessionalExporter

// ====================== تهيئة النظام ======================
// تشغيل النظام عند تحميل الصفحة
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('ProfessionalExporter جاهز للعمل ✅');
    });
} else {
    console.log('ProfessionalExporter جاهز للعمل ✅');
}


// تحديث تلقائي للنظام القديم
if (typeof ExportManager !== 'undefined') {
    // استبدال الدوال القديمة بالجديدة
    ExportManager.exportToExcel = ProfessionalExporter.exportExcel;
    ExportManager.exportToPDF = ProfessionalExporter.exportPDF;
    ExportManager.exportToCSV = ProfessionalExporter.exportCSV;
    ExportManager.exportToHTML = ProfessionalExporter.exportHTML;
    ExportManager.showPrintView = ProfessionalExporter.showPrintView;
    
    console.log('✅ تم تحديث نظام التصدير تلقائياً');
}