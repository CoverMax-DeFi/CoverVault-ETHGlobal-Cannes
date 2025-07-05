import { EndpointId } from '@layerzerolabs/lz-definitions'
import type { OAppOmniGraphHardhat, OmniPointHardhat } from '@layerzerolabs/ua-devtools-evm-hardhat'

// Define contract points for each chain
const arbitrumSepoliaContract: OmniPointHardhat = {
    eid: EndpointId.ARBSEP_V2_TESTNET,
    contractName: 'SimpleOFTRiskTokenSenior',
}

const baseSepoliaContract: OmniPointHardhat = {
    eid: EndpointId.BASESEP_V2_TESTNET,
    contractName: 'SimpleOFTRiskTokenSenior',
}

const config: OAppOmniGraphHardhat = {
    contracts: [
        {
            contract: arbitrumSepoliaContract,
        },
        {
            contract: baseSepoliaContract,
        },
    ],
    connections: [
        // Arbitrum Sepolia <-> Base Sepolia
        {
            from: arbitrumSepoliaContract,
            to: baseSepoliaContract,
            config: {
                enforcedOptions: [
                    {
                        msgType: 1,
                        optionType: 1, // LZ_RECEIVE
                        gas: 200000,
                    },
                ],
            },
        },
        {
            from: baseSepoliaContract,
            to: arbitrumSepoliaContract,
            config: {
                enforcedOptions: [
                    {
                        msgType: 1,
                        optionType: 1,
                        gas: 200000,
                    },
                ],
            },
        },
    ],
}

export default config