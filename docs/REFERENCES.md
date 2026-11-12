# 原理参考

以下官方资料用于核对教学解释的定性方向；资料不为本项目自行选取的数值系数、模拟胶图或产量预测提供实验验证。

1. [NEB：How should I determine the appropriate annealing temperature for my reaction?](https://www.neb.com/en-gb/faqs/how-should-i-determine-the-appropriate-annealing-temperature-for-my-reaction) — 退火条件需要考虑具体引物与反应体系，真实适宜温度通常需要实验优化；不能把输入参考 Tm 直接当成所有酶通用的最优退火温度。
2. [NEB：Hot Start PCR](https://www.neb.com/en/applications/dna-amplification-pcr-and-qpcr/specialty-pcr/hot-start-pcr) — 热启动通过限制低温下的酶活性，减少反应准备阶段不希望发生的扩增；不意味着后续所有条件下都没有非特异产物。
3. [Thermo Fisher Scientific：PCR Cycling Considerations](https://www.thermofisher.com/us/en/home/life-science/cloning/cloning-learning-center/invitrogen-school-of-molecular-biology/pcr-education/pcr-reagents-enzymes/pcr-cycling-considerations.html) — 循环条件和循环数影响产物，后期可进入平台；不能假设最终产量永久按理想的每轮翻倍增长。
4. [NEB：PCR Using Q5 High-Fidelity DNA Polymerase (M0491)](https://www.neb.com/protocols/pcr-using-q5-high-fidelity-dna-polymerase-m0491) — 不同酶有各自的配方和循环协议；高保真与复制准确性相关，不能根据模拟胶图亮度判断错误率。

## 来源与实现的边界

本项目未导入厂商实测数据，也未采用经校准的商业酶动力学。Q5、Taq 等名称不意味着厂商参与、认可或验证本软件。有效结合曲线、长度惩罚、启动来源项、100 的容量和所有随机扰动均为原创教学设定，详见 [MODEL.md](MODEL.md) 及 `model.js`。

当前版本适合观察“改变一个变量后，教学模型中的结果如何变化”，不用于决定真实实验配方或宣称真实样品会得到指定结果。未来若加入真实预测，需要另行引入明确的序列、体系、可追溯训练/校准数据和独立验证。
