/** @jest-environment jsdom */
import { Html5Qrcode } from 'html5-qrcode';
import { paymentCameraConfig } from '@/app/teacher/students/_components/payment-scan/cameraConfig';

test.each([true,false])('real QR library reaches getUserMedia using supported arguments (HD=%s)',async highResolution=>{
 const original=Object.getOwnPropertyDescriptor(navigator,'mediaDevices');
 const media=jest.fn().mockRejectedValue(new DOMException('test permission rejection','NotAllowedError'));
 Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia:media}});
 const host=document.createElement('div');host.id='camera-contract';document.body.append(host);
 try {
  const camera=new Html5Qrcode(host.id);
  await expect(camera.start({facingMode:'environment'},paymentCameraConfig(highResolution),()=>{},()=>{})).rejects.toBeDefined();
  expect(media).toHaveBeenCalledTimes(1);
  const request=media.mock.calls[0][0];
  expect(request.audio).toBe(false);
  expect(request.video.facingMode).toEqual(highResolution?{ideal:'environment'}:'environment');
 } finally {host.remove();if(original)Object.defineProperty(navigator,'mediaDevices',original);else Reflect.deleteProperty(navigator,'mediaDevices');}
});
