import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {DueMonthsCard} from '@/app/teacher/students/_components/payment-scan/DueMonthsCard';

test('different month discounts show base, percentage, net and a review notice',()=>{
  const dueMonths=[
    {sub:{id:'nov',month:11,year:2026,amount:800,discount:400},label:'نوفمبر 2026',isOld:true},
    {sub:{id:'dec',month:12,year:2026,amount:800,discount:120},label:'ديسمبر 2026',isOld:false},
  ];
  const markup=renderToStaticMarkup(React.createElement(DueMonthsCard,{
    student:{name:'طالب اختبار'} as any,dueMonths:dueMonths as any,selectedSubs:new Set(['nov','dec']),isConfirming:false,totalSelected:1080,
    resolveAmount:sub=>sub.amount-sub.discount,onToggle:()=>{},onConfirm:()=>{},onDismiss:()=>{},cardRef:{current:null},
  })).replace(/<[^>]*>/g,'');
  expect(markup).toContain('الخصم المسجّل مختلف بين الشهور');
  expect(markup).toContain('الأساسي ٨٠٠ ج');
  expect(markup).toContain('خصم ٥٠٪ · ٤٠٠ ج');
  expect(markup).toContain('خصم ١٥٪ · ١٢٠ ج');
  expect(markup).toContain('الصافي ٤٠٠ ج');expect(markup).toContain('الصافي ٦٨٠ ج');
});
