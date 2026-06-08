'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Pill, FileText, Send, Printer, Info } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

interface PrescriptionItem {
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export const PrescriptionCreator = ({ patientId, encounterId, onSave }: { patientId: string, encounterId: string, onSave: (data: any) => void }) => {
  const [items, setItems] = useState<PrescriptionItem[]>([
    { medicationName: '', dosage: '', frequency: '', duration: '', instructions: '' }
  ]);

  const addItem = () => {
    setItems([...items, { medicationName: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof PrescriptionItem, value: string) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="text-right">
          <h3 className="text-xl font-bold tracking-tight">منشئ الوصفات الطبية</h3>
          <p className="text-xs text-muted-foreground mt-1">حدد الأدوية والجرعات وتكرار الاستخدام ونظام العلاج للمريض.</p>
        </div>
        <Button variant="premium" size="sm" onClick={addItem} className="font-bold">
          <Plus className="w-4 h-4 ml-2" /> إضافة دواء
        </Button>
      </div>

      <div className="space-y-4">
        <AnimatePresence initial={false}>
          {items.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="relative overflow-hidden"
            >
              <Card className="p-6 bg-white dark:bg-zinc-900 border sub-border shadow-sm group hover:border-primary/30 transition-all text-right">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <Input 
                      label="اسم الدواء" 
                      placeholder="مثال: أموكسيسيلين ٥٠٠ ملغ" 
                      value={item.medicationName}
                      onChange={(e) => updateItem(index, 'medicationName', e.target.value)}
                    />
                  </div>
                  <div>
                    <Input 
                      label="الجرعة" 
                      placeholder="مثال: قرص واحد" 
                      value={item.dosage}
                      onChange={(e) => updateItem(index, 'dosage', e.target.value)}
                    />
                  </div>
                  <div className="relative">
                    <div className="flex items-center justify-between">
                       <Button 
                         variant="ghost" 
                         size="icon" 
                         className="absolute -top-2 -left-2 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10 rounded-full"
                         onClick={() => removeItem(index)}
                       >
                         <Trash2 className="w-4 h-4" />
                       </Button>
                    </div>
                    <Input 
                      label="التكرار" 
                      placeholder="مثال: ٣ مرات يومياً" 
                      value={item.frequency}
                      onChange={(e) => updateItem(index, 'frequency', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                   <div>
                      <Input 
                        label="المدة" 
                        placeholder="مثال: ٧ أيام" 
                        value={item.duration}
                        onChange={(e) => updateItem(index, 'duration', e.target.value)}
                      />
                   </div>
                   <div className="md:col-span-3">
                      <Input 
                        label="تعليمات خاصة" 
                        placeholder="مثال: يؤخذ بعد الأكل، تجنب منتجات الألبان..." 
                        value={item.instructions}
                        onChange={(e) => updateItem(index, 'instructions', e.target.value)}
                      />
                   </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 flex items-start gap-3 text-right">
         <Info className="w-5 h-5 text-primary mt-0.5 ml-2" />
         <p className="text-xs text-primary/80 font-medium leading-relaxed">
           باعتماد هذه الوصفة الطبية، سيتم توقيعها رقمياً بواسطة الطبيب المعالج وتسجيلها في التاريخ المرضي للمريض، كما سيتم إنشاء ملف PDF للوصفة لتسليمها للمريض.
         </p>
      </div>

      <div className="flex gap-3 justify-end pt-4 border-t sub-border">
         <Button variant="premium" className="font-bold px-8">
            <Printer className="w-4 h-4 ml-2" /> معاينة PDF
         </Button>
         <Button className="font-bold px-10 shadow-lg shadow-primary/20" onClick={() => onSave(items)}>
            <Send className="w-4 h-4 ml-2" /> إصدار الوصفة الطبية
         </Button>
      </div>
    </div>
  );
};
