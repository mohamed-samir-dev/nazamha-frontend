import { studentPrice } from "../studentPrice";
test("group transfer immediately uses the new group price and current discount", () => {
  expect(studentPrice({ discount_value: 10 }, 200).net).toBe(180);
  expect(studentPrice({ discount_value: 10 }, 250).net).toBe(225);
});
test("family discount takes precedence and removing it restores individual discount", () => {
  expect(studentPrice({ family_discount_percent: 20, discount_value: 10 }, 250).net).toBe(200);
  expect(studentPrice({ family_discount_percent: 0, discount_value: 10 }, 250).net).toBe(225);
});
test("custom price, teacher fallback, full exemption and rounding match billing", () => {
  expect(studentPrice({ custom_monthly_price: 300, discount_value: 33 }, 250, 100)).toEqual({ amount: 300, discount: 99, net: 201 });
  expect(studentPrice({ custom_monthly_price: 0 }, 0, 100).net).toBe(100);
  expect(studentPrice({ discount_value: 100 }, 250).net).toBe(0);
});
