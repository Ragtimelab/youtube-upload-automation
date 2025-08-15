import re
from typing import Dict, Optional


class ScriptParser:
    """대본 파일 파싱 클래스

    시니어 대상 YouTube 콘텐츠 대본을 파싱하여 구조화된 데이터로 변환합니다.

    대본 파일 구조:
    === 대본 ===
    [대본 내용]

    === 메타데이터 ===
    제목: [제목]
    설명: [설명]
    태그: [태그1, 태그2, ...]

    === 썸네일 제작 ===
    텍스트: [썸네일 텍스트]
    ImageFX 프롬프트: [이미지 생성 프롬프트]
    """

    def parse_script_file(self, content: str) -> Dict[str, str]:
        """대본 파일 파싱

        Args:
            content: 대본 파일의 전체 내용

        Returns:
            파싱된 데이터 딕셔너리
            - content: 대본 내용
            - title: 제목
            - description: 설명
            - tags: 태그 (콤마로 구분)
            - thumbnail_text: 썸네일 텍스트
            - imagefx_prompt: ImageFX 프롬프트
        """
        sections = {}

        try:
            # 대본 내용 추출
            script_section = self._extract_section(
                content, "대본", ["메타데이터", "썸네일 제작"]
            )
            if script_section:
                sections["content"] = script_section.strip()

            # 메타데이터 섹션 추출 및 파싱
            metadata_section = self._extract_section(
                content, "메타데이터", ["썸네일 제작"]
            )
            if metadata_section:
                metadata = self._parse_metadata(metadata_section)
                sections.update(metadata)

            # 썸네일 제작 섹션 추출 및 파싱
            thumbnail_section = self._extract_section(content, "썸네일 제작", [])
            if thumbnail_section:
                thumbnail_data = self._parse_thumbnail_section(thumbnail_section)
                sections.update(thumbnail_data)

        except Exception as e:
            raise ScriptParsingError(f"대본 파싱 중 오류 발생: {str(e)}")

        # 필수 필드 검증
        if not sections.get("content"):
            raise ScriptParsingError("대본 내용이 없습니다.")

        if not sections.get("title"):
            raise ScriptParsingError("제목이 없습니다.")

        return sections

    def _extract_section(
        self, content: str, section_name: str, next_sections: list
    ) -> Optional[str]:
        """특정 섹션 내용 추출

        Args:
            content: 전체 내용
            section_name: 추출할 섹션명
            next_sections: 다음에 올 수 있는 섹션들

        Returns:
            추출된 섹션 내용 또는 None
        """
        # 섹션 시작 패턴
        start_pattern = f"=== {section_name} ==="

        # 다음 섹션들의 패턴 생성
        if next_sections:
            end_patterns = [f"=== {section} ===" for section in next_sections]
            end_pattern = "|".join(end_patterns)
            pattern = rf"{re.escape(start_pattern)}(.*?)(?:{end_pattern}|$)"
        else:
            pattern = rf"{re.escape(start_pattern)}(.*?)$"

        match = re.search(pattern, content, re.DOTALL)
        return match.group(1).strip() if match else None

    def _parse_metadata(self, metadata_content: str) -> Dict[str, str]:
        """메타데이터 섹션 파싱

        Args:
            metadata_content: 메타데이터 섹션 내용

        Returns:
            파싱된 메타데이터 딕셔너리
        """
        metadata = {}

        # 제목 추출
        title_match = re.search(r"제목\s*:\s*(.+)", metadata_content, re.MULTILINE)
        if title_match:
            metadata["title"] = title_match.group(1).strip()

        # 설명 추출 (여러 줄 가능)
        desc_match = re.search(
            r"설명\s*:\s*(.+?)(?=\n\w+\s*:|$)", metadata_content, re.DOTALL
        )
        if desc_match:
            metadata["description"] = desc_match.group(1).strip()

        # 태그 추출
        tags_match = re.search(r"태그\s*:\s*(.+)", metadata_content, re.MULTILINE)
        if tags_match:
            tags_raw = tags_match.group(1).strip()
            # 콤마로 구분된 태그들을 정리
            tags_list = [tag.strip() for tag in tags_raw.split(",")]
            metadata["tags"] = ", ".join(tags_list)

        return metadata

    def _parse_thumbnail_section(self, thumbnail_content: str) -> Dict[str, str]:
        """썸네일 제작 섹션 파싱

        Args:
            thumbnail_content: 썸네일 섹션 내용

        Returns:
            파싱된 썸네일 데이터 딕셔너리
        """
        thumbnail_data = {}

        # 썸네일 텍스트 추출
        text_match = re.search(r"텍스트\s*:\s*(.+)", thumbnail_content, re.MULTILINE)
        if text_match:
            thumbnail_data["thumbnail_text"] = text_match.group(1).strip()

        # ImageFX 프롬프트 추출 (여러 줄 가능)
        prompt_match = re.search(
            r"ImageFX\s*프롬프트\s*:\s*(.+?)(?=\n\w+\s*:|$)",
            thumbnail_content,
            re.DOTALL | re.IGNORECASE,
        )
        if prompt_match:
            thumbnail_data["imagefx_prompt"] = prompt_match.group(1).strip()

        return thumbnail_data

    def validate_parsed_data(self, parsed_data: Dict[str, str]) -> bool:
        """파싱된 데이터 유효성 검증

        Args:
            parsed_data: 파싱된 데이터

        Returns:
            유효성 검증 결과
        """
        required_fields = ["content", "title"]

        for field in required_fields:
            if not parsed_data.get(field):
                return False

        # 제목 길이 제한 (YouTube 제목 최대 100자)
        if len(parsed_data.get("title", "")) > 100:
            return False

        # 설명 길이 제한 (YouTube 설명 최대 5000자)
        if len(parsed_data.get("description", "")) > 5000:
            return False

        return True


class ScriptParsingError(Exception):
    """대본 파싱 관련 예외"""

    pass
