/** @jest-environment jsdom */
import React,{act,useState} from 'react';
import {createRoot,Root} from 'react-dom/client';
import {StudentPaymentCard} from '@/app/teacher/students/[id]/_components/StudentPaymentCard';
import {SubscriptionsService} from '@/lib/services/subscriptionsService';
jest.mock('@/lib/services/subscriptionsService',()=>({SubscriptionsService:{updateSubscription:jest.fn()}}));
const rows=[{id:'a',month:10,year:2026,status:'due',amount:200,discount:0},{id:'b',month:11,year:2026,status:'due',amount:200,discount:0}] as any;
let host:HTMLDivElement,root:Root;
function Harness(){const [subs,setSubs]=useState(rows);return React.createElement(StudentPaymentCard,{studentId:'student',initialSubs:subs,onChanged:setSubs});}
beforeEach(async()=>{(globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;jest.clearAllMocks();host=document.createElement('div');document.body.append(host);root=createRoot(host);await act(async()=>root.render(React.createElement(Harness)));});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();});
test('different month saves resolving out of order cannot erase a pending choice',async()=>{
 const finish:Record<string,(v:any)=>void>={};
 (SubscriptionsService.updateSubscription as jest.Mock).mockImplementation(id=>new Promise(resolve=>{finish[id]=resolve;}));
 const cards=host.querySelectorAll<HTMLElement>('[role="button"]');
 await act(async()=>{cards[0].click();cards[1].click();cards[0].click();});
 expect(SubscriptionsService.updateSubscription).toHaveBeenCalledTimes(2);
 await act(async()=>finish.b({...rows[1],status:'paid'}));
 expect(cards[0].textContent).toContain('مدفوع');
 await act(async()=>finish.a({...rows[0],status:'paid'}));
 expect(Array.from(host.querySelectorAll('[role="button"]')).every(e=>e.textContent?.includes('مدفوع'))).toBe(true);
});
test('failed month rolls back only itself while another saved month remains paid',async()=>{
 const finish:Record<string,(v:any)=>void>={},fail:Record<string,(e:Error)=>void>={};
 (SubscriptionsService.updateSubscription as jest.Mock).mockImplementation(id=>new Promise((resolve,reject)=>{finish[id]=resolve;fail[id]=reject;}));
 const cards=host.querySelectorAll<HTMLElement>('[role="button"]');
 await act(async()=>{cards[0].click();cards[1].click();});
 await act(async()=>finish.b({...rows[1],status:'paid'}));
 await act(async()=>fail.a(new Error('offline')));
 expect(cards[0].textContent).toContain('مستحق');expect(cards[1].textContent).toContain('مدفوع');expect(host.querySelector('[role="alert"]')).not.toBeNull();
});
