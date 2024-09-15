"use client";

import { useEffect, useState } from "react";
import { Transaction } from "@mysten/sui/transactions";
import { useSuiClient } from "@mysten/dapp-kit";
import { useEnokiFlow, useZkLogin } from "@mysten/enoki/react";
import { getFaucetHost, requestSuiFromFaucetV0 } from "@mysten/sui/faucet";
import { ExternalLink, Github, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { BalanceChange } from "@mysten/sui/client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { track } from "@vercel/analytics";

export default function Page() {
  const client = useSuiClient(); // The SuiClient instance
  const enokiFlow = useEnokiFlow(); // The EnokiFlow instance
  const { address: suiAddress } = useZkLogin(); // The zkLogin instance

  /* Account information */
  const [balance, setBalance] = useState<number>(0);
  const [accountLoading, setAccountLoading] = useState<boolean>(true);

  /* Send Red Envelope state */
  const [totalAmount, setTotalAmount] = useState<string>("");
  const [numEnvelopes, setNumEnvelopes] = useState<string>("");
  const [redEnvelopeId, setRedEnvelopeId] = useState<string>("");
  const [sendLoading, setSendLoading] = useState<boolean>(false);

  /* Claim Red Envelope state */
  const [inputEnvelopeId, setInputEnvelopeId] = useState<string>("");
  const [claimLoading, setClaimLoading] = useState<boolean>(false);

  /**
   * Fetch account info on login
   */
  useEffect(() => {
    if (suiAddress) {
      getAccountInfo();
    }
  }, [suiAddress]);

  const startLogin = async () => {
    const promise = async () => {
      window.location.href = await enokiFlow.createAuthorizationURL({
        provider: "google",
        clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        redirectUrl: `${window.location.origin}/auth`,
        network: "testnet",
      });
    };

    toast.promise(promise, {
      loading: "正在登录...",
    });
  };

  /**
   * Fetch the account information
   */
  const getAccountInfo = async () => {
    if (!suiAddress) {
      return;
    }

    setAccountLoading(true);

    const balance = await client.getBalance({ owner: suiAddress });
    setBalance(parseInt(balance.totalBalance) / 10 ** 9);

    setAccountLoading(false);
  };

  /**
   * Request SUI from the faucet
   */
  const onRequestSui = async () => {
    const promise = async () => {
      track("Request SUI");

      if (!suiAddress) {
        throw new Error("未找到 SUI 地址");
      }

      if (balance > 3) {
        throw new Error("您的 SUI 余额已经足够！");
      }

      const res = await requestSuiFromFaucetV0({
        host: getFaucetHost("testnet"),
        recipient: suiAddress,
      });

      if (res.error) {
        throw new Error(res.error);
      }

      return res;
    };

    toast.promise(promise, {
      loading: "正在请求 SUI...",
      success: (data) => {
        console.log("成功获取 SUI！", data);

        const suiBalanceChange = data.transferredGasObjects
          .map((faucetUpdate) => {
            return faucetUpdate.amount / 10 ** 9;
          })
          .reduce((acc: number, change: any) => {
            return acc + change;
          }, 0);

        setBalance(balance + suiBalanceChange);

        return "成功获取 SUI！";
      },
      error: (error) => {
        return error.message;
      },
    });
  };

  /**
   * Send Red Envelope
   */
  async function sendRedEnvelope() {
    const promise = async () => {
      track("Send Red Envelope");

      setSendLoading(true);

      // Validate inputs
      const parsedAmount = parseFloat(totalAmount);
      const parsedNum = parseInt(numEnvelopes);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        setSendLoading(false);
        throw new Error("总金额无效");
      }
      if (isNaN(parsedNum) || parsedNum <= 0) {
        setSendLoading(false);
        throw new Error("红包个数无效");
      }

      // Get the keypair for the current user.
      const keypair = await enokiFlow.getKeypair({ network: "testnet" });
      console.log(keypair)

      // Create a new transaction block
      const txb = new Transaction();
      txb.setGasBudget(100000000)
      console.log(parsedAmount)
      const [coin] = txb.splitCoins(txb.gas, [
        txb.pure.u64(parsedAmount * 10 ** 9),
      ]);
      // Replace with actual package ID and function
      txb.moveCall({
        target: `${process.env.NEXT_PUBLIC_PACKAGE_ID}::lucky::send`,
        typeArguments: ["0x2::sui::SUI"],
        arguments: [
          txb.object("0x8"), // r: &Random
          coin,
          txb.pure.u8(parsedNum),
        ],
      });

      // Sign and execute the transaction block
      const res = await client.signAndExecuteTransaction({
        signer: keypair,
        transaction: txb,
        options: {
          showEffects: true,
          showEvents: true,
        },
      });

      setSendLoading(false);

      if (res.effects?.status.status !== "success") {
        throw new Error("发送红包失败: " + res.effects?.status.error);
      }

      const envelopeId = res.effects?.created?.[0]?.reference?.objectId;
      // Extract the red envelope ID from the transaction events or effects
      // const envelopeId = res.events?.find(
      //   (event) =>
      //     event.type ===
      //     "0x<package_id>::red_envelope::RedEnvelopeCreated"
      // )?.parsedJson?.envelope_id;

      setRedEnvelopeId(envelopeId || "未知");

      return res;
    };

    toast.promise(promise, {
      loading: "正在发送红包...",
      success: (data) => {
        return (
          <span className="flex flex-row items-center gap-2">
            红包发送成功！{" "}
            <a
              href={`https://suiscan.xyz/testnet/tx/${data.digest}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink width={12} />
            </a>
          </span>
        );
      },
      error: (error) => {
        return error.message;
      },
    });
  }

  /**
   * Claim Red Envelope
   */
  async function claimRedEnvelope() {
    const promise = async () => {
      track("Claim Red Envelope");

      setClaimLoading(true);

      if (!inputEnvelopeId) {
        setClaimLoading(false);
        throw new Error("请输入红包 ID");
      }

      // Get the keypair for the current user.
      const keypair = await enokiFlow.getKeypair({ network: "testnet" });

      // Create a new transaction block
      const txb = new Transaction();
      txb.setGasBudget(100000000)

      // Replace with actual package ID and function
      txb.moveCall({
        target: `${process.env.NEXT_PUBLIC_PACKAGE_ID}::lucky::claim`,
        typeArguments: ["0x2::sui::SUI"],
        arguments: [
          txb.object(inputEnvelopeId),
          txb.object("0x8")
        ],
      });

      // Sign and execute the transaction block
      const res = await client.signAndExecuteTransaction({
        signer: keypair,
        transaction: txb,
        options: {
          showEffects: true,
        },
      });
      console.log(res)
      setClaimLoading(false);

      if (res.effects?.status.status !== "success") {
        throw new Error("领取红包失败: " + res.effects?.status.error);
      }

      return res;
    };

    toast.promise(promise, {
      loading: "正在领取红包...",
      success: (data) => {
        getAccountInfo();
        return (
          <span className="flex flex-row items-center gap-2">
            成功领取红包！{" "}
            <a
              href={`https://suiscan.xyz/testnet/tx/${data.digest}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink width={12} />
            </a>
          </span>
        );
      },
      error: (error) => {
        return error.message;
      },
    });
  }

  if (suiAddress) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-4xl font-bold text-center mb-8">
          Web3 红包应用
        </h1>
        <Popover>
          <PopoverTrigger className="absolute top-4 right-4" asChild>
            <div>
              <Button className="hidden sm:block" variant={"secondary"}>
                {accountLoading ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  `${suiAddress?.slice(0, 5)}...${suiAddress?.slice(
                    -5
                  )} - ${balance.toPrecision(3)} SUI`
                )}
              </Button>
              <Avatar className="block sm:hidden">
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
            </div>
          </PopoverTrigger>
          <PopoverContent>
            <Card className="border-none shadow-none">
              <CardHeader>
                <CardTitle>账户信息</CardTitle>
                <CardDescription>
                  查看您的账户信息。
                </CardDescription>
              </CardHeader>
              <CardContent>
                {accountLoading ? (
                  <div className="w-full flex flex-col items-center">
                    <LoaderCircle className="animate-spin" />
                  </div>
                ) : (
                  <>
                    <div className="flex flex-row gap-1 items-center">
                      <span>地址: </span>
                      <div className="flex flex-row gap-1">
                        <span>{`${suiAddress?.slice(
                          0,
                          5
                        )}...${suiAddress?.slice(-5)}`}</span>
                        <a
                          href={`https://suiscan.xyz/testnet/account/${suiAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink width={12} />
                        </a>
                      </div>
                    </div>
                    <div>
                      <span>余额: </span>
                      <span>{balance.toPrecision(3)} SUI</span>
                    </div>
                  </>
                )}
              </CardContent>
              <CardFooter className="flex flex-row gap-2 items-center justify-between">
                <Button
                  variant={"outline"}
                  size={"sm"}
                  onClick={onRequestSui}
                >
                  申请 SUI
                </Button>
                <Button
                  variant={"destructive"}
                  size={"sm"}
                  className="w-full text-center"
                  onClick={async () => {
                    await enokiFlow.logout();
                    window.location.reload();
                  }}
                >
                  退出登录
                </Button>
              </CardFooter>
            </Card>
          </PopoverContent>
        </Popover>
        <div className="flex flex-col md:flex-row gap-8 mt-8">
          {/* 发红包功能 */}
          <Card className="w-full md:w-1/2">
            <CardHeader>
              <CardTitle>发红包</CardTitle>
              <CardDescription>
                输入总金额和红包个数，生成红包 ID。
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div>
                <Label htmlFor="totalAmount">总金额 (SUI)</Label>
                <Input
                  type="number"
                  id="totalAmount"
                  placeholder="请输入总金额"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="numEnvelopes">红包个数</Label>
                <Input
                  type="number"
                  id="numEnvelopes"
                  placeholder="请输入红包个数"
                  value={numEnvelopes}
                  onChange={(e) => setNumEnvelopes(e.target.value)}
                />
              </div>
              {redEnvelopeId && (
                <div>
                  <Label>红包 ID：</Label>
                  <div className="flex items-center gap-2">
                    <span>{redEnvelopeId}</span>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(redEnvelopeId);
                        toast.success("已复制红包 ID");
                      }}
                    >
                      复制
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={sendRedEnvelope}
                disabled={sendLoading}
              >
                发红包
              </Button>
            </CardFooter>
          </Card>

          {/* 抢红包功能 */}
          <Card className="w-full md:w-1/2">
            <CardHeader>
              <CardTitle>抢红包</CardTitle>
              <CardDescription>输入红包 ID，领取红包。</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div>
                <Label htmlFor="envelopeId">红包 ID</Label>
                <Input
                  type="text"
                  id="envelopeId"
                  placeholder="请输入红包 ID"
                  value={inputEnvelopeId}
                  onChange={(e) => setInputEnvelopeId(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={claimRedEnvelope}
                disabled={claimLoading}
              >
                抢红包
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-start p-4">
      <a
        href="https://github.com/dantheman8300/enoki-example-app"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute top-4 right-0 sm:right-4"
        onClick={() => {
          track("github");
        }}
      >
        <Button variant={"link"} size={"icon"}>
          <Github />
        </Button>
      </a>
      <div className="text-center">
        <h1 className="text-4xl font-bold m-4">Web3 红包应用</h1>
        <p className="text-md m-4 opacity-80 max-w-md">
          这是一个演示应用，展示了
          <a
            href="https://portal.enoki.mystenlabs.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-blue-600 hover:text-blue-400"
          >
            Enoki
          </a>
          的 zkLogin 流程和赞助交易流程。注意：此示例运行在
          <span className="text-blue-600"> Sui 测试网络</span>
        </p>
      </div>
      <Button onClick={startLogin}>使用 Google 登录</Button>
    </div>
  );
}
