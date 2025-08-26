"""
ScriptParser 테스트
"""

import pytest
from app.services.script_parser import ScriptParser, ScriptParsingError


def create_test_script_content():
    """테스트용 대본 콘텐츠 생성"""
    return """
=== 대본 ===
안녕하세요, 시청자 여러분! 오늘은 60년 만에 처음 공개하는 할머니의 숨겨진 이야기를 들려드리려고 합니다.

1960년대 초, 아직 어린 신부였던 할머니는 시댁 살이가 힘들어 몰래 친정에 편지를 썼습니다. 
하지만 그 편지는 시어머니에게 발각되고 말았죠. 

그날 밤, 할머니는 혼자 마당에 앉아 눈물을 흘리며 다짐했습니다.
"언젠가 내 손주들에게는 이런 마음의 짐을 주지 않겠다."

그 약속을 지키기 위해 할머니가 선택한 방법은 무엇이었을까요?
오늘 영상에서 그 감동적인 이야기를 공개합니다.

=== 메타데이터 ===
제목: 60년 만에 밝히는 할머니의 비밀 - 시댁살이 고충과 가족 사랑
설명: 1960년대 어린 신부였던 할머니의 진솔한 이야기를 통해 그 시대 여성들의 삶과 가족에 대한 깊은 사랑을 느껴보세요. 
현재를 살아가는 시니어 세대에게 위로와 공감을 전하는 따뜻한 영상입니다.
태그: 시니어, 할머니, 1960년대, 가족, 시댁살이, 회상, 감동, 한국사, 여성사

=== 썸네일 제작 ===
텍스트: 60년 만에 공개하는 할머니의 비밀
ImageFX 프롬프트: 1960년대 한국의 전통 한옥 마당에서 한복을 입은 젊은 여성이 달빛 아래 혼자 앉아 편지를 읽고 있는 따뜻하고 감성적인 장면, 빈티지 톤, 따뜻한 조명
"""


class TestScriptParser:
    """ScriptParser 테스트 클래스"""
    
    def test_basic_parsing(self):
        """기본 파싱 기능 테스트"""
        parser = ScriptParser()
        test_content = create_test_script_content()
        
        result = parser.parse_script_file(test_content)
        
        assert result is not None
        assert 'content' in result
        assert 'title' in result
        assert 'description' in result
        assert 'tags' in result
        assert 'thumbnail_text' in result
        assert 'imagefx_prompt' in result
        
        assert result['title'] == "60년 만에 밝히는 할머니의 비밀 - 시댁살이 고충과 가족 사랑"
        assert "안녕하세요, 시청자 여러분!" in result['content']
        assert "시니어, 할머니" in result['tags']


    def test_validation(self):
        """데이터 유효성 검증 테스트"""
        parser = ScriptParser()
        
        # 정상 데이터 테스트
        valid_data = {
            'content': '테스트 대본 내용',
            'title': '테스트 제목',
            'description': '테스트 설명',
            'tags': '테스트, 태그'
        }
        
        assert parser.validate_parsed_data(valid_data) is True
        
        # 필수 필드 누락 테스트
        invalid_data = {
            'description': '설명만 있음',
            'tags': '태그만, 있음'
        }
        
        assert parser.validate_parsed_data(invalid_data) is False
        
        # 제목 길이 초과 테스트
        long_title_data = {
            'content': '내용',
            'title': 'A' * 101,  # 101자 제목
            'description': '설명'
        }
        
        assert parser.validate_parsed_data(long_title_data) is False


    def test_error_handling(self):
        """에러 처리 테스트"""
        parser = ScriptParser()
        
        # 빈 내용 테스트
        with pytest.raises(ScriptParsingError):
            parser.parse_script_file("")
        
        # 대본 섹션 없음 테스트
        with pytest.raises(ScriptParsingError):
            parser.parse_script_file("=== 메타데이터 ===\n제목: 테스트")
        
        # 제목 없음 테스트
        with pytest.raises(ScriptParsingError):
            parser.parse_script_file("=== 대본 ===\n테스트 내용\n=== 메타데이터 ===\n설명: 설명만")


    def test_edge_cases(self):
        """경계 케이스 테스트"""
        parser = ScriptParser()
        
        # 최소한의 정보만 있는 케이스
        minimal_content = """
=== 대본 ===
최소한의 대본 내용입니다.

=== 메타데이터 ===
제목: 최소 제목
"""
        
        result = parser.parse_script_file(minimal_content)
        assert result is not None
        assert result['title'] == "최소 제목"
        assert result['content'] == "최소한의 대본 내용입니다."
        
        # 공백이 많은 케이스
        whitespace_content = """

    === 대본 ===
    
    
    공백이 많은 대본 내용입니다.
    
    
    === 메타데이터 ===
    
    제목   :   공백 테스트 제목   
    설명   :   공백이 많은 설명입니다   
    태그   :   공백 , 테스트 , 태그   
    
    """
        
        result = parser.parse_script_file(whitespace_content)
        assert result is not None
        assert result['title'].strip() == "공백 테스트 제목"
        assert "공백이 많은 설명입니다" in result.get('description', '')
        assert "공백" in result.get('tags', '')
    
    def test_alternative_thumbnail_section(self):
        """썸네일 정보/썸네일 제작 섹션 대안 형식 테스트"""
        parser = ScriptParser()
        
        # "썸네일 정보" 섹션
        content_with_info = """
=== 대본 ===
테스트 대본 내용

=== 메타데이터 ===
제목: 테스트 제목

=== 썸네일 정보 ===
텍스트: 정보 섹션 텍스트
ImageFX 프롬프트: 정보 섹션 프롬프트
"""
        
        result = parser.parse_script_file(content_with_info)
        assert result['thumbnail_text'] == "정보 섹션 텍스트"
        assert result['imagefx_prompt'] == "정보 섹션 프롬프트"
        
        # "썸네일 제작" 섹션
        content_with_creation = """
=== 대본 ===
테스트 대본 내용

=== 메타데이터 ===
제목: 테스트 제목

=== 썸네일 제작 ===
텍스트: 제작 섹션 텍스트
ImageFX 프롬프트: 제작 섹션 프롬프트
"""
        
        result = parser.parse_script_file(content_with_creation)
        assert result['thumbnail_text'] == "제작 섹션 텍스트"
        assert result['imagefx_prompt'] == "제작 섹션 프롬프트"

    def test_validate_with_errors_method(self):
        """validate_with_errors 메서드 상세 테스트"""
        parser = ScriptParser()
        
        # 정상 데이터 - 에러 없음
        valid_data = {
            'content': '테스트 대본 내용',
            'title': '정상 제목',
            'description': '정상 설명',
            'tags': '태그1, 태그2'
        }
        
        is_valid, errors = parser.validate_with_errors(valid_data)
        assert is_valid is True
        assert len(errors) == 0
        
        # 필수 필드 누락
        invalid_data = {}
        is_valid, errors = parser.validate_with_errors(invalid_data)
        assert is_valid is False
        assert len(errors) == 2
        assert any("대본 내용이 없습니다" in error for error in errors)
        assert any("제목이 없습니다" in error for error in errors)
        
        # 제목만 누락
        title_missing = {'content': '내용만 있음'}
        is_valid, errors = parser.validate_with_errors(title_missing)
        assert is_valid is False
        assert len(errors) == 1
        assert "제목이 없습니다" in errors[0]
        
        # 내용만 누락
        content_missing = {'title': '제목만 있음'}
        is_valid, errors = parser.validate_with_errors(content_missing)
        assert is_valid is False
        assert len(errors) == 1
        assert "대본 내용이 없습니다" in errors[0]
        
        # 제목 길이 초과 (YouTube 제한: 100자)
        long_title_data = {
            'content': '내용',
            'title': 'A' * 101,  # 101자 제목
        }
        is_valid, errors = parser.validate_with_errors(long_title_data)
        assert is_valid is False
        assert len(errors) == 1
        assert "제목이 너무 깁니다" in errors[0]
        assert "101/100" in errors[0]
        
        # 설명 바이트 초과 (YouTube 제한: 5000바이트)
        long_description_data = {
            'content': '내용',
            'title': '정상 제목',
            'description': '한글' * 2501  # 한글은 3바이트씩이므로 7503바이트
        }
        is_valid, errors = parser.validate_with_errors(long_description_data)
        assert is_valid is False
        assert len(errors) == 1
        assert "설명이 너무 깁니다" in errors[0]
        
        # 태그 길이 초과 (YouTube 제한: 500자)
        long_tags_data = {
            'content': '내용',
            'title': '정상 제목',
            'tags': 'A' * 501  # 501자 태그
        }
        is_valid, errors = parser.validate_with_errors(long_tags_data)
        assert is_valid is False
        assert len(errors) == 1
        assert "태그가 너무 깁니다" in errors[0]
        assert "501/500" in errors[0]
        
        # 복합 에러 - 여러 문제가 동시에 발생
        multiple_errors_data = {
            'content': '',  # 내용 누락
            'title': 'A' * 101,  # 제목 길이 초과
            'description': 'B' * 5001,  # 설명 바이트 초과
            'tags': 'C' * 501  # 태그 길이 초과
        }
        is_valid, errors = parser.validate_with_errors(multiple_errors_data)
        assert is_valid is False
        assert len(errors) == 4
        error_text = ' '.join(errors)
        assert "대본 내용이 없습니다" in error_text
        assert "제목이 너무 깁니다" in error_text
        assert "설명이 너무 깁니다" in error_text
        assert "태그가 너무 깁니다" in error_text

    def test_section_extraction_edge_cases(self):
        """섹션 추출 경계 케이스 테스트"""
        parser = ScriptParser()
        
        # 섹션이 존재하지 않는 경우
        content_no_section = "일반 텍스트만 있는 내용"
        result = parser._extract_section(content_no_section, "대본", [])
        assert result is None
        
        # 섹션 이름이 텍스트 중간에 포함된 경우 (잘못된 매칭 방지)
        content_false_match = """
        이것은 === 대본 === 이라는 텍스트가 포함된 일반 내용입니다.
        실제 섹션은 아닙니다.
        
        === 진짜 대본 ===
        이것이 실제 대본 내용입니다.
        """
        result = parser._extract_section(content_false_match, "대본", [])
        # 마지막 정확한 섹션 헤더만 매칭되어야 함
        assert "이것이 실제 대본 내용입니다." in result
        assert "이것은 === 대본 === 이라는" not in result
        
        # 빈 섹션 
        empty_section_content = """
        === 대본 ===
        
        
        === 메타데이터 ===
        제목: 테스트
        """
        result = parser._extract_section(empty_section_content, "대본", ["메타데이터"])
        assert result.strip() == ""

    def test_metadata_parsing_edge_cases(self):
        """메타데이터 파싱 경계 케이스 테스트"""
        parser = ScriptParser()
        
        # 메타데이터 필드가 없는 경우
        empty_metadata = ""
        result = parser._parse_metadata(empty_metadata)
        assert result == {}
        
        # 제목에 특수문자가 포함된 경우
        special_char_metadata = """
        제목: 특수문자 테스트: 콜론, 세미콜론; 괄호() 대시-언더바_
        설명: 설명 내용
        """
        result = parser._parse_metadata(special_char_metadata)
        assert "특수문자 테스트: 콜론, 세미콜론; 괄호() 대시-언더바_" in result["title"]
        
        # 여러줄 설명
        multiline_metadata = """
        제목: 테스트 제목
        설명: 첫 번째 줄 설명
        두 번째 줄 설명
        세 번째 줄 설명
        태그: 태그1, 태그2
        """
        result = parser._parse_metadata(multiline_metadata)
        assert "첫 번째 줄 설명" in result["description"]
        assert "두 번째 줄 설명" in result["description"]
        assert "세 번째 줄 설명" in result["description"]
        
        # 태그 정리 테스트 (공백 및 중복 처리)
        messy_tags_metadata = """
        제목: 테스트
        태그:   태그1  ,  태그2,태그3   , 태그4 ,   
        """
        result = parser._parse_metadata(messy_tags_metadata)
        tags = result["tags"]
        # 빈 태그 제거 후 결과 확인
        assert "태그1, 태그2, 태그3, 태그4" in tags or "태그1, 태그2, 태그3, 태그4, " in tags

    def test_thumbnail_parsing_edge_cases(self):
        """썸네일 파싱 경계 케이스 테스트"""
        parser = ScriptParser()
        
        # 빈 썸네일 섹션
        empty_thumbnail = ""
        result = parser._parse_thumbnail_section(empty_thumbnail)
        assert result == {}
        
        # ImageFX 프롬프트만 있는 경우 (텍스트 없음)
        imagefx_only = """
        ImageFX 프롬프트: AI 이미지 생성을 위한 프롬프트입니다.
        """
        result = parser._parse_thumbnail_section(imagefx_only)
        assert "thumbnail_text" not in result
        assert result["imagefx_prompt"] == "AI 이미지 생성을 위한 프롬프트입니다."
        
        # 텍스트만 있는 경우 (ImageFX 프롬프트 없음)
        text_only = """
        텍스트: 썸네일에 들어갈 텍스트입니다.
        """
        result = parser._parse_thumbnail_section(text_only)
        assert result["thumbnail_text"] == "썸네일에 들어갈 텍스트입니다."
        assert "imagefx_prompt" not in result
        
        # 여러줄 ImageFX 프롬프트
        multiline_prompt = """
        텍스트: 간단한 텍스트
        ImageFX 프롬프트: 첫 번째 줄 프롬프트
        두 번째 줄 프롬프트
        세 번째 줄 프롬프트
        """
        result = parser._parse_thumbnail_section(multiline_prompt)
        assert "첫 번째 줄 프롬프트" in result["imagefx_prompt"]
        assert "두 번째 줄 프롬프트" in result["imagefx_prompt"]
        assert "세 번째 줄 프롬프트" in result["imagefx_prompt"]

    def test_new_title_section_format(self):
        """새로운 제목 섹션 형식 테스트"""
        parser = ScriptParser()
        
        # 별도 제목 섹션이 있는 형식
        content_with_title_section = """
        === 제목 ===
        별도 제목 섹션의 제목입니다
        
        === 대본 ===
        대본 내용입니다.
        
        === 메타데이터 ===
        설명: 메타데이터 설명
        태그: 테스트, 태그
        """
        
        result = parser.parse_script_file(content_with_title_section)
        assert result["title"] == "별도 제목 섹션의 제목입니다"
        assert result["content"] == "대본 내용입니다."
        assert "메타데이터 설명" in result["description"]

    def test_comprehensive_parsing_scenario(self):
        """종합적인 파싱 시나리오 테스트"""
        parser = ScriptParser()
        
        # 모든 섹션이 포함된 복합 시나리오
        comprehensive_content = """
        === 제목 ===
        종합 테스트 제목
        
        === 대본 ===
        이것은 종합적인 대본 내용입니다.
        여러 줄에 걸쳐 작성된 대본입니다.
        
        특별한 문장도 포함되어 있습니다.
        
        === 메타데이터 ===
        설명: 종합 테스트를 위한 설명입니다.
        여러 줄로 작성된 설명입니다.
        태그: 종합테스트, 파싱테스트, 시나리오테스트
        
        === 썸네일 정보 ===
        텍스트: 종합 테스트 썸네일
        ImageFX 프롬프트: comprehensive test scenario image
        with multiple lines
        """
        
        result = parser.parse_script_file(comprehensive_content)
        
        # 모든 필드가 올바르게 파싱되었는지 확인
        assert result["title"] == "종합 테스트 제목"
        assert "이것은 종합적인 대본 내용입니다." in result["content"]
        assert "여러 줄에 걸쳐 작성된 대본입니다." in result["content"]
        assert "종합 테스트를 위한 설명입니다." in result["description"]
        assert "여러 줄로 작성된 설명입니다." in result["description"]
        assert "종합테스트, 파싱테스트, 시나리오테스트" == result["tags"]
        assert result["thumbnail_text"] == "종합 테스트 썸네일"
        assert "comprehensive test scenario image" in result["imagefx_prompt"]
        assert "with multiple lines" in result["imagefx_prompt"]
        
        # 데이터 유효성도 확인
        assert parser.validate_parsed_data(result) is True
        is_valid, errors = parser.validate_with_errors(result)
        assert is_valid is True
        assert len(errors) == 0