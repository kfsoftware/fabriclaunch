'use client'
import 'leaflet/dist/leaflet.css'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'

// You'll need to import a marker icon due to a known issue with React Leaflet
import { getOrganizationsWithNodes } from '@/lib/logic'
import L from 'leaflet'
// import './marker.css'

let DefaultIcon = L.icon({
	iconUrl: '/database.svg',
	// shadowUrl: iconShadow as any,
	shadowSize: [41, 41],
	pane: 'shadowPane',
	iconSize: [25, 41],
	iconAnchor: [12, 41],
})

const createCustomIcon = (region) => {
	return L.divIcon({
		className: 'custom-icon',
		html: `
		<div class="icon-container">
		  <img src="/database.svg" class="icon-image" />
		  <div class="icon-label">${region}</div>
		</div>
	  `,
		iconSize: [40, 60],
		iconAnchor: [20, 60],
		popupAnchor: [0, -60],
	})
}

L.Marker.prototype.options.icon = DefaultIcon

const DatabaseMap = ({ nodes }: { nodes: Awaited<ReturnType<typeof getOrganizationsWithNodes>> }) => {
	// i want to get the regions and then aggregate the nodes and org per region + lat long
	// then plot them on the map
	const regions = nodes.map(({ node }) => node.region)

	return (
		<MapContainer center={[50.5, 30.5]} zoom={2} style={{ height: '100%', width: '100%' }}>
			<TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
			{regions.map((region, index) => {
				const nodesForRegion = nodes.filter(({ node }) => node.region === region)
				const orgs = nodesForRegion.map(({ node, organization }) => organization.mspId)
				const uniqueOrgs = [...new Set(orgs)]
				const node = nodesForRegion[0].node

				return (
					<Marker key={index} position={[parseFloat(node.latitude), parseFloat(node.longitude)]} icon={createCustomIcon(region)}>
						<Popup>
							{uniqueOrgs.map((org, index) => {
								const orgPeers = nodesForRegion.filter(({ node, organization }) => organization.mspId === org && node.type === 'PEER')
								const orgOrderers = nodesForRegion.filter(({ node, organization }) => organization.mspId === org && node.type === 'ORDERER')
								return (
									<div key={index}>
										{org}: {orgPeers.length} peers and {orgOrderers.length} orderers
									</div>
								)
							})}
						</Popup>
					</Marker>
				)
			})}
		</MapContainer>
	)
}

export default DatabaseMap
