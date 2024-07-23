package main

import (
	"bytes"
	"crypto/x509"
	"encoding/base64"
	"encoding/json"
	"encoding/pem"
	"fmt"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang/protobuf/proto"
	"github.com/hyperledger/fabric-config/configtx"
	"github.com/hyperledger/fabric-config/configtx/membership"
	"github.com/hyperledger/fabric-config/configtx/orderer"
	"github.com/hyperledger/fabric-config/protolator"
	cb "github.com/hyperledger/fabric-protos-go/common"
	"github.com/hyperledger/fabric-sdk-go/pkg/fab/resource"
	"github.com/hyperledger/fabric/protoutil"

	"net/http"

	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"

	_ "channel-mgmt-fabric/docs" // This line is necessary for swag to find your docs!

	"time"
)

type ChannelGenesis struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

type ChannelUpdate struct {
	ID      string `json:"id"`
	Content string `json:"content"`
}
type ChannelGenesisResponse struct {
	Message string `json:"message"`
	Channel string `json:"channel"`
}

func main() {
	router := gin.Default()

	// Group routes under /api
	api := router.Group("/api")
	api.POST("/channel/genesis", createChannelGenesis)
	api.POST("/channel/update", createChannelUpdate)
	api.POST("/block/decode", decodeBlock)
	api.POST("/block/anchorpeers", setAnchorPeersToConfig)

	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	router.Run(":8080")
}

type SetAnchorPeersInput struct {
	BlockB64    string     `json:"blockB64"`
	AnchorPeers []HostPort `json:"anchorPeers"`
	MSPID       string     `json:"mspID"`
	ChannelName string     `json:"channelName"`
}

type SetAnchorPeersResponse struct {
	NoChanges bool   `json:"noChanges"`
	BlockB64  string `json:"blockB64"`
}

// @Summary Set anchor peers to a config block
// @Description Set anchor peers to a config block
// @Accept json
// @Produce json
// @Param update body SetAnchorPeersInput true "Anchor Peers Info"
// @Success 200 {object} SetAnchorPeersResponse
// @Router /api/block/anchorpeers [post]
// @Tags block
func setAnchorPeersToConfig(c *gin.Context) {
	var input SetAnchorPeersInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Decode the block from base64
	blockBytes, err := base64.StdEncoding.DecodeString(input.BlockB64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to decode block from base64"})
		return
	}

	// Unmarshal the block
	block := &cb.Block{}
	err = proto.Unmarshal(blockBytes, block)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to unmarshal block"})
		return
	}

	// Extract config from block
	cfgBlock, err := resource.ExtractConfigFromBlock(block)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to extract config from block"})
		return
	}

	// Create a new configtx manager
	cftxGen := configtx.New(cfgBlock)
	app := cftxGen.Application().Organization(input.MSPID)

	// Remove existing anchor peers
	currentAnchorPeers, err := app.AnchorPeers()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get current anchor peers"})
		return
	}
	for _, anchorPeer := range currentAnchorPeers {
		err = app.RemoveAnchorPeer(configtx.Address{
			Host: anchorPeer.Host,
			Port: anchorPeer.Port,
		})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to remove anchor peer %v", anchorPeer)})
			return
		}
	}

	// Add new anchor peers
	for _, anchorPeer := range input.AnchorPeers {
		err = app.AddAnchorPeer(configtx.Address{
			Host: anchorPeer.Host,
			Port: anchorPeer.Port,
		})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to add anchor peer %v", anchorPeer)})
			return
		}
	}

	// Compute the config update
	configUpdateBytes, err := cftxGen.ComputeMarshaledUpdate(input.ChannelName)
	if err != nil {
		if !strings.Contains(err.Error(), "no differences detected between original and updated config") {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to compute config update"})
			return
		}
		c.JSON(http.StatusOK, SetAnchorPeersResponse{
			BlockB64:  "",
			NoChanges: true,
		})
		return
	}

	configUpdate := &cb.ConfigUpdate{}
	err = proto.Unmarshal(configUpdateBytes, configUpdate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to unmarshal config update"})
		return
	}
	channelConfigBytes, err := CreateConfigUpdateEnvelope(input.ChannelName, configUpdate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create config update envelope"})
		return
	}
	// Encode the config update to base64
	configUpdateB64 := base64.StdEncoding.EncodeToString(channelConfigBytes)

	// Return the response
	c.JSON(http.StatusOK, SetAnchorPeersResponse{
		BlockB64: configUpdateB64,
	})
}

type DecodeBlockInput struct {
	DataB64 string `json:"dataB64"`
}
type DecodeBlockResponse struct {
	Data map[string]any `json:"data"`
}

// @Summary Decode a block
// @Description Decode a block from base64 to JSON
// @Accept json
// @Produce json
// @Param block body DecodeBlockInput true "Block Data"
// @Success 200 {object} DecodeBlockResponse
// @Router /api/block/decode [post]
func decodeBlock(c *gin.Context) {
	// Here you would typically save the channel genesis to a database
	// For this example, we'll just return a success message
	var input DecodeBlockInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	blockBytes, err := base64.StdEncoding.DecodeString(input.DataB64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	block := &cb.Block{}
	err = proto.Unmarshal(blockBytes, block)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	var buf bytes.Buffer
	err = protolator.DeepMarshalJSON(&buf, block)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	var data map[string]any
	err = json.Unmarshal(buf.Bytes(), &data)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, DecodeBlockResponse{
		Data: data,
	})

}
func memberToConfigtxOrg(mspID string, rootTlsCert *x509.Certificate, signTlsCert *x509.Certificate, ordererUrls []string, anchorPeers []configtx.Address) (configtx.Organization, error) {
	genesisOrg := configtx.Organization{
		Name: mspID,
		MSP: configtx.MSP{
			Name:                 mspID,
			RootCerts:            []*x509.Certificate{signTlsCert},
			CryptoConfig:         membership.CryptoConfig{},
			TLSRootCerts:         []*x509.Certificate{rootTlsCert},
			TLSIntermediateCerts: nil,
			NodeOUs: membership.NodeOUs{
				Enable: true,
				ClientOUIdentifier: membership.OUIdentifier{
					Certificate:                  signTlsCert,
					OrganizationalUnitIdentifier: "client",
				},
				PeerOUIdentifier: membership.OUIdentifier{
					Certificate:                  signTlsCert,
					OrganizationalUnitIdentifier: "peer",
				},
				AdminOUIdentifier: membership.OUIdentifier{
					Certificate:                  signTlsCert,
					OrganizationalUnitIdentifier: "admin",
				},
				OrdererOUIdentifier: membership.OUIdentifier{
					Certificate:                  signTlsCert,
					OrganizationalUnitIdentifier: "orderer",
				},
			},
		},
		OrdererEndpoints: ordererUrls,
		Policies: map[string]configtx.Policy{
			"Admins": {
				Type: "Signature",
				Rule: fmt.Sprintf("OR('%s.admin')", mspID),
			},
			"Readers": {
				Type: "Signature",
				Rule: fmt.Sprintf("OR('%s.member')", mspID),
			},
			"Writers": {
				Type: "Signature",
				Rule: fmt.Sprintf("OR('%s.member')", mspID),
			},
			"Endorsement": {
				Type: "Signature",
				Rule: fmt.Sprintf("OR('%s.member')", mspID),
			},
		},
		AnchorPeers: anchorPeers,
	}
	return genesisOrg, nil
}

type Response map[string]any

// @Summary Create a new channel genesis
// @Description Create a new channel with the given name and description
// @Accept json
// @Produce json
// @Param channel body CreateChannelInput true "Channel Genesis Info"
// @Success 201 {object} ChannelGenesisResponse
// @Router /api/channel/genesis [post]
func createChannelGenesis(c *gin.Context) {
	var genesis CreateChannelInput
	if err := c.ShouldBindJSON(&genesis); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	channelConfig, err := ParseAndCreateChannel(genesis)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}
	// Here you would typically save the channel genesis to a database
	// For this example, we'll just return a success message
	c.JSON(http.StatusCreated, ChannelGenesisResponse{
		Message: "Channel genesis created successfully",
		Channel: base64.StdEncoding.EncodeToString(channelConfig),
	})
}

type HostPort struct {
	Host string `json:"host"`
	Port int    `json:"port"`
}
type Organization struct {
	Name             string     `json:"name"`
	AnchorPeers      []HostPort `json:"anchorPeers"`
	OrdererEndpoints []string   `json:"ordererEndpoints"`
	SignCACert       string     `json:"signCACert"`
	TLSCACert        string     `json:"tlsCACert"`
}
type AddressWithCerts struct {
	Address       HostPort `json:"address"`
	ClientTLSCert string   `json:"clientTLSCert"`
	ServerTLSCert string   `json:"serverTLSCert"`
}
type CreateChannelInput struct {
	Name        string             `json:"name"`
	PeerOrgs    []Organization     `json:"peerOrgs"`
	OrdererOrgs []Organization     `json:"ordererOrgs"`
	Consenters  []AddressWithCerts `json:"consenters"`
}

func parseX509Certificate(contents []byte) (*x509.Certificate, error) {
	block, _ := pem.Decode(contents)
	crt, err := x509.ParseCertificate(block.Bytes)
	if err != nil {
		return nil, err
	}
	return crt, nil
}

// @Summary Create a channel update
// @Description Create an update for an existing channel
// @Accept json
// @Produce json
// @Param update body ChannelUpdate true "Channel Update Info"
// @Success 201 {object} Response
// @Failure 400 {object} Response
// @Router /api/channel/update [post]
func createChannelUpdate(c *gin.Context) {
	var update ChannelUpdate
	if err := c.ShouldBindJSON(&update); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	var input CreateChannelInput
	err := c.ShouldBindJSON(&input)
	if err != nil {
		c.JSON(500, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Here you would typically save the channel update to a database
	// For this example, we'll just return a success message
	c.JSON(http.StatusCreated, gin.H{
		"message": "Channel update created successfully",
		"update":  update,
	})
}
func ParseAndCreateChannel(
	input CreateChannelInput) ([]byte, error) {
	peerOrgs := []configtx.Organization{}
	for _, org := range input.PeerOrgs {
		signCACert, err := parseX509Certificate([]byte(org.SignCACert))
		if err != nil {
			return nil, err
		}
		tlsCACert, err := parseX509Certificate([]byte(org.TLSCACert))
		if err != nil {
			return nil, err
		}
		anchorPeers := []configtx.Address{}
		for _, anchorPeer := range org.AnchorPeers {
			anchorPeers = append(anchorPeers, configtx.Address{
				Host: anchorPeer.Host,
				Port: anchorPeer.Port,
			})
		}
		genesisOrg, err := memberToConfigtxOrg(org.Name, tlsCACert, signCACert, org.OrdererEndpoints, anchorPeers)
		if err != nil {
			return nil, err
		}
		peerOrgs = append(peerOrgs, genesisOrg)
	}
	ordererOrgs := []configtx.Organization{}
	for _, org := range input.OrdererOrgs {
		signCACert, err := parseX509Certificate([]byte(org.SignCACert))
		if err != nil {
			return nil, err
		}
		tlsCACert, err := parseX509Certificate([]byte(org.TLSCACert))
		if err != nil {
			return nil, err
		}
		anchorPeers := []configtx.Address{}
		for _, anchorPeer := range org.AnchorPeers {
			anchorPeers = append(anchorPeers, configtx.Address{
				Host: anchorPeer.Host,
				Port: anchorPeer.Port,
			})
		}
		genesisOrg, err := memberToConfigtxOrg(org.Name, tlsCACert, signCACert, org.OrdererEndpoints, anchorPeers)
		if err != nil {
			return nil, err
		}
		ordererOrgs = append(ordererOrgs, genesisOrg)
	}
	ordererCapabilities := []string{"V2_0"}
	peerCapabilities := []string{"V2_0", "V2_5"}
	etcdRaftOptions := orderer.EtcdRaftOptions{
		TickInterval:         "500ms",
		ElectionTick:         10,
		HeartbeatTick:        1,
		MaxInflightBlocks:    5,
		SnapshotIntervalSize: 16 * 1024 * 1024, // 16 MB
	}

	consenters := []orderer.Consenter{}
	for _, ord := range input.Consenters {
		clientTLSCert, err := parseX509Certificate([]byte(ord.ClientTLSCert))
		if err != nil {
			return nil, err
		}
		serverTLSCert, err := parseX509Certificate([]byte(ord.ServerTLSCert))
		if err != nil {
			return nil, err
		}
		consenters = append(consenters, orderer.Consenter{
			Address:       orderer.EtcdAddress{Host: ord.Address.Host, Port: ord.Address.Port},
			ClientTLSCert: clientTLSCert,
			ServerTLSCert: serverTLSCert,
		})
	}

	ch := configtx.Channel{
		Application: configtx.Application{
			Organizations: peerOrgs,
			Capabilities:  peerCapabilities,
			Policies: map[string]configtx.Policy{
				"Readers": {
					Type: "ImplicitMeta",
					Rule: "ANY Readers",
				},
				"Writers": {
					Type: "ImplicitMeta",
					Rule: "ANY Writers",
				},
				"Admins": {
					Type: "ImplicitMeta",
					Rule: "MAJORITY Admins",
				},
				"Endorsement": {
					Type: "ImplicitMeta",
					Rule: "MAJORITY Endorsement",
				},
				"LifecycleEndorsement": {
					Type: "ImplicitMeta",
					Rule: "MAJORITY Endorsement",
				},
			},
			ACLs:      defaultACLs(),
			ModPolicy: "",
		},
		Orderer: configtx.Orderer{
			OrdererType:  "etcdraft",
			BatchTimeout: 3 * time.Second,
			BatchSize: orderer.BatchSize{
				MaxMessageCount:   100,
				AbsoluteMaxBytes:  10 * 1024 * 1024,
				PreferredMaxBytes: 2 * 1024 * 1024,
			},
			EtcdRaft: orderer.EtcdRaft{
				Consenters: consenters,
				Options:    etcdRaftOptions,
			},
			Organizations: ordererOrgs,
			Capabilities:  ordererCapabilities,
			Policies: map[string]configtx.Policy{
				"Readers": {
					Type: "ImplicitMeta",
					Rule: "ANY Readers",
				},
				"Writers": {
					Type: "ImplicitMeta",
					Rule: "ANY Writers",
				},
				"Admins": {
					Type: "ImplicitMeta",
					Rule: "MAJORITY Admins",
				},
				"BlockValidation": {
					Type: "ImplicitMeta",
					Rule: "ANY Writers",
				},
			},
			State: "STATE_NORMAL",
		},
		Capabilities: ordererCapabilities,
		Policies: map[string]configtx.Policy{
			"Readers": {
				Type: "ImplicitMeta",
				Rule: "ANY Readers",
			},
			"Writers": {
				Type: "ImplicitMeta",
				Rule: "ANY Writers",
			},
			"Admins": {
				Type: "ImplicitMeta",
				Rule: "MAJORITY Admins",
			},
		},
	}
	block, err := CreateChannelBlock(input.Name, ch)
	if err != nil {
		return nil, err
	}
	return block, nil
}

func CreateChannelBlock(name string, channelConfig configtx.Channel) ([]byte, error) {
	block, err := configtx.NewApplicationChannelGenesisBlock(channelConfig, name)
	if err != nil {
		return nil, err
	}
	blockBytes, err := proto.Marshal(block)
	if err != nil {
		return nil, err
	}
	return blockBytes, nil
}

func defaultACLs() map[string]string {
	return map[string]string{
		"_lifecycle/CheckCommitReadiness": "/Channel/Application/Writers",

		//  ACL policy for _lifecycle's "CommitChaincodeDefinition" function
		"_lifecycle/CommitChaincodeDefinition": "/Channel/Application/Writers",

		//  ACL policy for _lifecycle's "QueryChaincodeDefinition" function
		"_lifecycle/QueryChaincodeDefinition": "/Channel/Application/Writers",

		//  ACL policy for _lifecycle's "QueryChaincodeDefinitions" function
		"_lifecycle/QueryChaincodeDefinitions": "/Channel/Application/Writers",

		// ---Lifecycle System Chaincode (lscc) function to policy mapping for access control---//

		//  ACL policy for lscc's "getid" function
		"lscc/ChaincodeExists": "/Channel/Application/Readers",

		//  ACL policy for lscc's "getdepspec" function
		"lscc/GetDeploymentSpec": "/Channel/Application/Readers",

		//  ACL policy for lscc's "getccdata" function
		"lscc/GetChaincodeData": "/Channel/Application/Readers",

		//  ACL Policy for lscc's "getchaincodes" function
		"lscc/GetInstantiatedChaincodes": "/Channel/Application/Readers",

		// ---Query System Chaincode (qscc) function to policy mapping for access control---//

		//  ACL policy for qscc's "GetChainInfo" function
		"qscc/GetChainInfo": "/Channel/Application/Readers",

		//  ACL policy for qscc's "GetBlockByNumber" function
		"qscc/GetBlockByNumber": "/Channel/Application/Readers",

		//  ACL policy for qscc's  "GetBlockByHash" function
		"qscc/GetBlockByHash": "/Channel/Application/Readers",

		//  ACL policy for qscc's "GetTransactionByID" function
		"qscc/GetTransactionByID": "/Channel/Application/Readers",

		//  ACL policy for qscc's "GetBlockByTxID" function
		"qscc/GetBlockByTxID": "/Channel/Application/Readers",

		// ---Configuration System Chaincode (cscc) function to policy mapping for access control---//

		//  ACL policy for cscc's "GetConfigBlock" function
		"cscc/GetConfigBlock": "/Channel/Application/Readers",

		//  ACL policy for cscc's "GetChannelConfig" function
		"cscc/GetChannelConfig": "/Channel/Application/Readers",

		// ---Miscellaneous peer function to policy mapping for access control---//

		//  ACL policy for invoking chaincodes on peer
		"peer/Propose": "/Channel/Application/Writers",

		//  ACL policy for chaincode to chaincode invocation
		"peer/ChaincodeToChaincode": "/Channel/Application/Writers",

		// ---Events resource to policy mapping for access control// // // ---//

		//  ACL policy for sending block events
		"event/Block": "/Channel/Application/Readers",

		//  ACL policy for sending filtered block events
		"event/FilteredBlock": "/Channel/Application/Readers",
	}
}

func CreateConfigUpdateEnvelope(channelID string, configUpdate *cb.ConfigUpdate) ([]byte, error) {
	configUpdate.ChannelId = channelID
	configUpdateData, err := proto.Marshal(configUpdate)
	if err != nil {
		return nil, err
	}
	configUpdateEnvelope := &cb.ConfigUpdateEnvelope{}
	configUpdateEnvelope.ConfigUpdate = configUpdateData
	envelope, err := protoutil.CreateSignedEnvelope(cb.HeaderType_CONFIG_UPDATE, channelID, nil, configUpdateEnvelope, 0, 0)
	if err != nil {
		return nil, err
	}
	envelopeData, err := proto.Marshal(envelope)
	if err != nil {
		return nil, err
	}
	return envelopeData, nil
}
