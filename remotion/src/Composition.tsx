import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';

export const MyComposition: React.FC = () => {
	const frame = useCurrentFrame();
	const opacity = interpolate(frame, [0, 30], [0, 1], {
		extrapolateRight: 'clamp',
	});

	return (
		<AbsoluteFill
			style={{
				backgroundColor: '#1a1614',
				justifyContent: 'center',
				alignItems: 'center',
			}}
		>
			<div
				style={{
					opacity,
					fontFamily: 'sans-serif',
					fontSize: 80,
					color: '#f4ece1',
					letterSpacing: 4,
				}}
			>
				SOUL &amp; FUEL
			</div>
		</AbsoluteFill>
	);
};
