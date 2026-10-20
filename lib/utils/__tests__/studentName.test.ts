import { validateStudentName } from "../studentName";
test.each(["أحمد محمد", "  محمد   علي ", "John Smith"])("allows a full name: %s", value => expect(validateStudentName(value)).toBe(""));
test.each(["123", "أحمد", "أحمد ١٢", "أحمد @محمد"])("rejects invalid name: %s", value => expect(validateStudentName(value)).not.toBe(""));
