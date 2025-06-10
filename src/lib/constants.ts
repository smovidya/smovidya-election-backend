function item<const Value extends string, const Description extends string>(
	value: Value,
	description: Description,
) {
	return {
		const: value,
		description,
	};
}

// TODO: Change the election date and time to the actual election date and time.

export const API_PROD_URL =
	"https://api-smovidya-election.bunyawatapp37204.workers.dev";

export const electionInfo = {
	// The start date and time of the election.
	// เปิดโหวต 23 เมษายน 2568 เวลา 07:00 น. (valid included 07:00:00)
	voteStart: new Date("2025-06-10T07:00:00+07:00"),

	// The end date and time of the election.
	// ปิดโหวต 23 เมษายน 2568 เวลา 17:00 น. (valid included 17:00:00)
	voteEnd: new Date("2025-06-11T18:00:00+07:00"),

	// Announcement date and time of the election results.
	// ประกาศผล 27 เมษายน 2568 เวลา 00:00 น.
	resultAnnouncement: new Date("2025-06-12T00:00:00+07:00"),

	// The valid positions that the candidates can run for.
	positions: [
		item("president", "นายกสโมสร"),
		item("vice-president-1", "อุปนายกคนที่ 1"),
		item("vice-president-2", "อุปนายกคนที่ 2"),
		item("secretary", "เลขานุการ"),
		item("treasurer", "เหรัญญิก"),
		item("student-relations", "ประธานฝ่ายนิสิตสัมพันธ์"),
		item("academic", "ประธานฝ่ายวิชาการ"),
		item("public-service", "ประธานฝ่ายพัฒนาสังคมและบำเพ็ญประโยชน์"),
		item("art", "ประธานฝ่ายศิลปะและวัฒนธรรม"),
		item("sport", "ประธานฝ่ายกีฬา"),
	],
	// positionNames: {
	// 	president: "นายกสโมสร",
	// 	"vice-president-1": "อุปนายกคนที่ 1",
	// 	"vice-president-2": "อุปนายกคนที่ 2",
	// 	secretary: "เลขานุการ",
	// 	treasurer: "เหรัญญิก",
	// 	"student-relations": "ประธานฝ่ายนิสิตสัมพันธ์",
	// 	academic: "ประธานฝ่ายวิชาการ",
	// 	"public-service": "ประธานฝ่ายพัฒนาสังคมและบำเพ็ญประโยชน์",
	// 	art: "ประธานฝ่ายศิลปะและวัฒนธรรม",
	// 	sport: "ประธานฝ่ายกีฬา",
	// } as const,
};
