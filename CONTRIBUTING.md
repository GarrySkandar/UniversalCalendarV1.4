# Contributing

感谢你帮助改进 Universal Civilization Calendar。

## 开始之前

1. 先搜索现有 Issue，确认问题或提案尚未被讨论。
2. 较大的功能、历法规则变更或架构调整，请先创建 Issue 说明范围、依据和兼容性影响。
3. 新历法和文明时间体系应优先通过现有 Provider + Plugin ABI 接入，不直接修改 Temporal Core。

## 本地开发

Windows 使用 Python 3.11：

```text
start_windows.bat
```

Linux 或 macOS：

```bash
./start_unix.sh
```

## 测试

提交前请运行全部 JavaScript 回归测试和 Python 检查：

```bash
for test in tests_*.js; do node "$test"; done
python -m py_compile server.py
python tests_lunar_cultural_label.py
```

如果变更涉及历法规则，请同时提供可复核的来源、RuleSet/版本、适用范围和边界日期测试。第三方数据或算法必须在 `SOURCES.md` 中记录来源与许可证。

## Pull Request

- 一个 Pull Request 聚焦一个主题；
- 说明用户可见变化、测试结果和兼容性影响；
- 不提交虚拟环境、缓存、日志、凭据或用户数据；
- 保留文明术语的原文优先策略，并为新增 UI 文本补充相应语言资源。

提交贡献即表示你同意按项目的 MIT License 发布该贡献。
