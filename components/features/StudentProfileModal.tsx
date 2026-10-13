import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Student, Group, Grade } from '@/lib/types';
import { User, Phone, Wallet, Save, Trash2 } from 'lucide-react';

interface StudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  groups: Group[];
  grades: Grade[];
  onSave: (studentId: string, updates: Partial<Student>) => Promise<void>;
}

export function StudentProfileModal({
  isOpen,
  onClose,
  student,
  groups,
  grades,
  onSave
}: StudentProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'basic' | 'contact' | 'financial'>('basic');
  const [isLoading, setIsLoading] = useState(false);
  const [prevStudentId, setPrevStudentId] = useState<string | null>(null);

  const getFormDataFromStudent = (s: Student): Partial<Student> => ({
    name: s.name,
    grade_id: s.grade_id,
    group_id: s.group_id,
    parent_phone: s.parent_phone || "",
    parent_job: s.parent_job || "",
    student_email: s.student_email || "",
    discount_value: s.discount_value || 0,
    discount_reason: s.discount_reason || "",
    apply_discount_to_books: s.apply_discount_to_books || false,
    custom_monthly_price: s.custom_monthly_price ?? null,
    sibling_family_id: s.sibling_family_id || "",
  });

  const [formData, setFormData] = useState<Partial<Student>>(
    () => student ? getFormDataFromStudent(student) : {}
  );

  if (student && student.id !== prevStudentId) {
    setPrevStudentId(student.id);
    setFormData(getFormDataFromStudent(student));
    setActiveTab('basic');
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: value === '' ? '' : parseFloat(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    if (!student) return;
    setIsLoading(true);
    try {
      const sanitizedData = { ...formData };
      if ((sanitizedData.discount_value as unknown as string) === '') sanitizedData.discount_value = 0;
      if ((sanitizedData.custom_monthly_price as unknown as string) === '') sanitizedData.custom_monthly_price = null;
      if (sanitizedData.sibling_family_id === '') sanitizedData.sibling_family_id = null;
      await onSave(student.id, sanitizedData);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  if (!student) return null;

  const tabBtn = (tab: 'basic' | 'contact' | 'financial', icon: React.ReactNode, label: string) => (
    <button
      onClick={() => setActiveTab(tab)}
      style={{
        background: activeTab === tab ? 'var(--color-teal)' : 'transparent',
        color: activeTab === tab ? '#fff' : 'var(--text-secondary)',
        border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s ease'
      }}
    >
      {icon} {label}
    </button>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`تعديل بيانات الطالب: ${student.name}`}
      maxWidth="600px"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>إلغاء</Button>
          <Button variant="primary" onClick={handleSave} isLoading={isLoading} leftIcon={<Save size={18} />}>حفظ التغييرات</Button>
        </>
      }
    >
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
        {tabBtn('basic', <User size={16} />, 'أساسية')}
        {tabBtn('contact', <Phone size={16} />, 'تواصل')}
        {tabBtn('financial', <Wallet size={16} />, 'مالية وخصومات')}
      </div>

      <div style={{ minHeight: '250px' }}>
        {activeTab === 'basic' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <Input label="اسم الطالب" name="name" value={formData.name || ''} onChange={handleChange} />
            <div className="form-group">
              <label className="form-label">السنة الدراسية</label>
              <select
                name="grade_id" className="form-input" value={formData.grade_id || ''}
                onChange={(e) => { handleChange(e); setFormData(prev => ({ ...prev, group_id: '' })); }}
              >
                <option value="">-- اختر السنة الدراسية --</option>
                {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">المجموعة</label>
              <select name="group_id" className="form-input" value={formData.group_id || ''} onChange={handleChange}>
                <option value="">-- بدون مجموعة --</option>
                {groups
                  .filter(g => !formData.grade_id || g.grade_id === formData.grade_id)
                  .map(g => <option key={g.id} value={g.id}>{g.name}</option>)
                }
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" style={{ color: "var(--text-secondary)", fontSize: "0.82rem" }}>
                كود العائلة — يُدار تلقائياً بواسطة النظام
              </label>
              <input
                className="form-input"
                value={formData.sibling_family_id || "غير مرتبط بعائلة"}
                disabled
                style={{ opacity: 0.5, cursor: "not-allowed", fontSize: "0.8rem", fontFamily: "monospace" }}
              />
            </div>
          </div>
        )}

        {activeTab === 'contact' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <Input label="رقم هاتف ولي الأمر (للواتساب)" name="parent_phone" value={formData.parent_phone || ''} onChange={handleChange} placeholder="مثال: 01000000000" />
            <Input label="وظيفة ولي الأمر" name="parent_job" value={formData.parent_job || ''} onChange={handleChange} placeholder="مثال: مهندس، دكتور..." />
            <Input label="إيميل الطالب (لربط منصات الامتحانات)" name="student_email" type="email" value={formData.student_email || ''} onChange={handleChange} placeholder="student@example.com" />
          </div>
        )}

        {activeTab === 'financial' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)', padding: '15px', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#818cf8' }}>سعر مخصص للطالب</h4>
              <p style={{ margin: '0 0 15px 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                لو عايز الطالب ده يدفع سعر مختلف عن سعر المجموعة، حدده هنا. اتركه فارغ لاستخدام سعر المجموعة.
              </p>
              <Input
                label="السعر الشهري المخصص (اتركه فارغ لسعر المجموعة)"
                name="custom_monthly_price"
                type="number"
                min={0}
                value={formData.custom_monthly_price === null || formData.custom_monthly_price === undefined ? '' : formData.custom_monthly_price}
                onChange={handleChange}
                placeholder="مثال: 100"
              />
            </div>

            <div style={{ background: 'rgba(20, 184, 166, 0.1)', border: '1px solid rgba(20, 184, 166, 0.2)', padding: '15px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4 style={{ margin: 0, color: 'var(--color-teal)' }}>إعدادات الخصم الثابت</h4>
                {(formData.discount_value ?? 0) > 0 && (
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, discount_value: 0, discount_reason: '' }))}
                    title="حذف الخصم"
                    style={{
                      background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)',
                      color: '#f87171', borderRadius: '6px', padding: '4px 10px',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.82rem'
                    }}
                  >
                    <Trash2 size={14} /> حذف الخصم
                  </button>
                )}
              </div>
              <p style={{ margin: '0 0 15px 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                قيمة الخصم سيتم طرحها أوتوماتيكياً من مصاريف الطالب كل شهر وقت إصدار الفاتورة.
              </p>
              <Input
                label="قيمة الخصم بالجنيه"
                name="discount_value"
                type="number"
                min={0}
                value={formData.discount_value === undefined ? '' : formData.discount_value}
                onChange={handleChange}
                placeholder="مثال: 50"
              />
            </div>

            <Input label="سبب الخصم (ملاحظة للسكرتارية)" name="discount_reason" value={formData.discount_reason || ''} onChange={handleChange} placeholder="مثال: أيتام، إخوة، ظروف مادية..." />

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
              <input
                type="checkbox" id="apply_discount_to_books" name="apply_discount_to_books"
                checked={formData.apply_discount_to_books || false} onChange={handleChange}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <label htmlFor="apply_discount_to_books" style={{ cursor: 'pointer' }}>
                تطبيق هذا الخصم على المذكرات والكتب أيضاً
              </label>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
