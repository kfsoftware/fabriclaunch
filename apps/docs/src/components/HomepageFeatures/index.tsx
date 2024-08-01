import clsx from 'clsx'
import Heading from '@theme/Heading'
import styles from './styles.module.css'
import {Network, Shield, Workflow} from 'lucide-react'
type FeatureItem = {
	title: string
	Svg: React.ComponentType<React.ComponentProps<'svg'>>
	description: JSX.Element
}

const FeatureList: FeatureItem[] = [
	{
		title: 'Decentralized12',
		// Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
		Svg: Network,
		description: <>Spread onboarding tasks across your organization. Reduce bottlenecks</>,
	},
	{
		title: 'Governance',
		// Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
		Svg: Shield,
		description: <>Maintain control and compliance with unified rules.</>,
	},
	{
		title: 'Automation',
		// Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
		Svg: Workflow,
		description: <>Streamline processes. Save time and reduce errors.</>,
	},
]

function Feature({ title, Svg, description }: FeatureItem) {
	return (
		<div className={clsx('col col--4')}>
			<div className="text--center">
				<Svg className={styles.featureSvg} role="img" />
			</div>
			<div className="text--center padding-horiz--md">
				<Heading as="h3">{title}</Heading>
				<p>{description}</p>
			</div>
		</div>
	)
}

export default function HomepageFeatures(): JSX.Element {
	return (
		<section className={styles.features}>
			<div className="container">
				<div className="row">
					{FeatureList.map((props, idx) => (
						<Feature key={idx} {...props} />
					))}
				</div>
			</div>
		</section>
	)
}
