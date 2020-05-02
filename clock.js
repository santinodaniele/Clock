var svg = d3.select("svg"),
	width = +svg.attr("width"),
	height = +svg.attr("height"),
	radius = Math.min(width, height) / 1.9,
	armRadius = radius / 22,
	dotRadius = armRadius - 6;

var duration = 750,
	now = new Date(Date.now() + 2 * duration);

var pi = Math.PI,
	tau = pi * 2;

var fields = [
	{radius: 0.2 * radius, interval: d3.timeYear,   subinterval: d3.timeMonth,  format: d3.timeFormat("%b")},
	{radius: 0.3 * radius, interval: d3.timeMonth,  subinterval: d3.timeDay,    format: d3.timeFormat("%d")},
	{radius: 0.4 * radius, interval: d3.timeWeek,   subinterval: d3.timeDay,    format: d3.timeFormat("%a")},
	{radius: 0.6 * radius, interval: d3.timeDay,    subinterval: d3.timeHour,   format: d3.timeFormat("%H")},
	{radius: 0.7 * radius, interval: d3.timeHour,   subinterval: d3.timeMinute, format: d3.timeFormat("%M")},
	{radius: 0.8 * radius, interval: d3.timeMinute, subinterval: d3.timeSecond, format: d3.timeFormat("%S")}
];

var color = d3.scaleRainbow()
	.domain([0, tau]);

var arcArm = d3.arc()
	.startAngle(function(d) { return armRadius / d.radius; })
	.endAngle(function(d) { return -pi - armRadius / d.radius; })
	.innerRadius(function(d) { return d.radius - armRadius; })
	.outerRadius(function(d) { return d.radius + armRadius; })
	.cornerRadius(armRadius);

var field = svg.append("g")
	.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")
	.selectAll(".field")
	.data(fields)
	.enter().append("g")
	.attr("class", "field");

field.append("circle")
	.attr("class", "field-track")
	.attr("r", function(d) { return d.radius; });

var fieldTick = field.selectAll(".field-tick")
	.data(function(d) {
		var date = d.interval(new Date(2000, 0, 1));
		d.range = d.subinterval.range(date, d.interval.offset(date, 1));
		return d.range.map(function(t) { return {time: t, field: d}; });
	})
	.enter().append("g")
	.attr("class", "field-tick")
	.attr("transform", function(d, i) {
		var angle = i / d.field.range.length * tau - pi / 2;
		return "translate(" + Math.cos(angle) * d.field.radius + "," + Math.sin(angle) * d.field.radius + ")";
	});

fieldTick.append("circle")
	.attr("r", dotRadius - 3)
	.style("fill", function(d, i) { return color(i / d.field.range.length * tau); });

fieldTick.append("text")
	.attr("dy", "0.35em")
	.text(function(d) { return d.field.format(d.time).slice(0, 2); });

var fieldArm = field.append("path")
	.attr("class", "field-arm")
	.attr("transform", "rotate(0)")
	.attr("d", function(d) {
		return arcArm(d)
			+ "M0," + (dotRadius - d.radius)
			+ "a" + dotRadius + "," + dotRadius + " 0 0,1 0," + -dotRadius * 2
			+ "a" + dotRadius + "," + dotRadius + " 0 0,1 0," + dotRadius * 2;
	});

(function tick() {
	var now = new Date,
		then = new Date(+now + duration),
		next = d3.timeSecond.offset(d3.timeSecond(then), 1),
		delay = next - duration - now;

	if (delay < duration) delay += 1000, then = next;

	fieldArm.transition()
		.duration(duration)
		.each(function(d) {
			var start = d.interval(then);
			d.activeLength = d.subinterval.count(start, d.interval.offset(start, 1));
			d.activeIndex = d.subinterval.count(start, then);
			d.angle = d.activeIndex / d.range.length * tau;
		})
		.attr("transform", function(d) { return "rotate(" + d.angle / pi * 180 + ")"; })
		.style("fill", function(d) { return color(d.angle); });

	fieldTick
		.classed("field-tick--disabled", function(d, i) { return i >= d.field.activeLength; })
		.classed("field-tick--active", function(d, i) { return i === d.field.activeIndex; });

	setTimeout(tick, delay);
})();