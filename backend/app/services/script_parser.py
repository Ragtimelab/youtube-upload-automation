import re
from typing import Dict, List, Optional, Tuple

from ..core.exceptions import ScriptParsingError
from ..core.constants import YouTubeConstants


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
            # 제목 섹션 추출 (새로운 형식 지원)
            title_section = self._extract_section(
                content, "제목", ["메타데이터", "썸네일 정보", "대본"]
            )
            if title_section:
                sections["title"] = title_section.strip()

            # 대본 내용 추출
            script_section = self._extract_section(
                content, "대본", ["메타데이터", "썸네일 제작", "썸네일 정보"]
            )
            if script_section:
                sections["content"] = script_section.strip()

            # 메타데이터 섹션 추출 및 파싱
            metadata_section = self._extract_section(
                content, "메타데이터", ["썸네일 제작", "썸네일 정보", "대본"]
            )
            if metadata_section:
                metadata = self._parse_metadata(metadata_section)
                sections.update(metadata)

            # 썸네일 제작 섹션 추출 및 파싱 (기존 형식)
            thumbnail_section = self._extract_section(content, "썸네일 제작", [])
            if thumbnail_section:
                thumbnail_data = self._parse_thumbnail_section(thumbnail_section)
                sections.update(thumbnail_data)
            
            # 썸네일 정보 섹션 추출 및 파싱 (새로운 형식)
            thumbnail_info_section = self._extract_section(content, "썸네일 정보", ["대본"])
            if thumbnail_info_section:
                thumbnail_data = self._parse_thumbnail_section(thumbnail_info_section)
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
        """파싱된 데이터 유효성 검증 (YouTube API 제한 적용)

        Args:
            parsed_data: 파싱된 데이터

        Returns:
            유효성 검증 결과
        """
        required_fields = ["content", "title"]

        for field in required_fields:
            if not parsed_data.get(field):
                return False

        # 제목 길이 제한 (YouTube API)
        title = parsed_data.get("title", "")
        if len(title) > YouTubeConstants.TITLE_MAX_LENGTH:
            return False

        # 설명 바이트 단위 제한 (YouTube API)
        description = parsed_data.get("description", "")
        if len(description.encode("utf-8")) > YouTubeConstants.DESCRIPTION_MAX_BYTES:
            return False

        # 태그 길이 제한 (YouTube API)
        tags = parsed_data.get("tags", "")
        if len(tags) > YouTubeConstants.TAGS_MAX_LENGTH:
            return False

        return True

    def validate_with_errors(self, parsed_data: Dict[str, str]) -> Tuple[bool, List[str]]:
        """상세한 에러 메시지와 함께 유효성 검증

        Args:
            parsed_data: 파싱된 데이터

        Returns:
            (검증 성공 여부, 에러 메시지 리스트)
        """
        errors = []

        # 필수 필드 검증
        required_fields = ["content", "title"]
        for field in required_fields:
            if not parsed_data.get(field):
                field_names = {"content": "대본 내용", "title": "제목"}
                errors.append(f"{field_names[field]}이 없습니다.")

        # 제목 길이 제한 (YouTube API)
        title = parsed_data.get("title", "")
        if len(title) > YouTubeConstants.TITLE_MAX_LENGTH:
            errors.append(
                f"제목이 너무 깁니다 ({len(title)}/{YouTubeConstants.TITLE_MAX_LENGTH}자)"
            )

        # 설명 바이트 단위 제한 (YouTube API)
        description = parsed_data.get("description", "")
        description_bytes = len(description.encode("utf-8"))
        if description_bytes > YouTubeConstants.DESCRIPTION_MAX_BYTES:
            errors.append(
                f"설명이 너무 깁니다 ({description_bytes}/{YouTubeConstants.DESCRIPTION_MAX_BYTES} 바이트)"
            )

        # 태그 길이 제한 (YouTube API)
        tags = parsed_data.get("tags", "")
        if len(tags) > YouTubeConstants.TAGS_MAX_LENGTH:
            errors.append(
                f"태그가 너무 깁니다 ({len(tags)}/{YouTubeConstants.TAGS_MAX_LENGTH}자)"
            )

        return len(errors) == 0, errors


